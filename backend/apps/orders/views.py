from decimal import Decimal
from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from .models import Order, OrderItem, OrderGiftBox, OrderGiftBoxItem
from .serializers import (
    OrderSerializer, OrderListSerializer,
    CheckoutSerializer, UpdateOrderStatusSerializer
)
from apps.cart.models import Cart
from apps.users.models import Address


def _subscriber_discount(subtotal):
    subscriber_discount_rate = Decimal(str(getattr(settings, 'SUBSCRIBER_DISCOUNT_RATE', '0.15')))
    return round(subtotal * subscriber_discount_rate, 2)


class CheckoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Get user's cart
        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'success': False, 'message': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({'success': False, 'message': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate stock for all items before proceeding
        stock_errors = []
        for item in cart.items.select_related('product', 'variant_sku').all():
            effective_stock = item.variant_sku.stock if item.variant_sku else item.product.stock
            if effective_stock < item.quantity:
                stock_errors.append(
                    f"'{item.product.name}': only {effective_stock} available, you requested {item.quantity}."
                )
        if stock_errors:
            return Response({
                'success': False,
                'message': 'Some items are out of stock.',
                'errors': stock_errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Resolve shipping address
        shipping_data = {}
        if data.get('address_id'):
            try:
                address = Address.objects.get(pk=data['address_id'], user=request.user)
                shipping_data = {
                    'shipping_full_name': address.full_name,
                    'shipping_phone': address.phone,
                    'shipping_street': address.street_address,
                    'shipping_apartment': address.apartment,
                    'shipping_city': address.city,
                    'shipping_state': address.state,
                    'shipping_postal_code': address.postal_code,
                    'shipping_country': address.country,
                }
            except Address.DoesNotExist:
                return Response({'success': False, 'message': 'Address not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            for field in ['shipping_full_name', 'shipping_phone', 'shipping_street',
                          'shipping_apartment', 'shipping_city', 'shipping_state',
                          'shipping_postal_code', 'shipping_country']:
                shipping_data[field] = data.get(field, '')

        # Calculate totals
        subtotal = cart.subtotal

        # Add gift box fees (sent from frontend)
        gift_box_fees_data = data.get('gift_box_fees', [])
        gift_box_total = Decimal("0.00")
        for fee in gift_box_fees_data:
            try:
                gift_box_total += Decimal(str(fee.get('price', '0')))
            except Exception:
                pass

        is_subscriber = bool(getattr(request.user, 'is_subscriber', False))
        shipping_cost = self._calculate_shipping(subtotal, is_subscriber)
        tax = round(subtotal * Decimal("0.08"), 2)  # 8% tax
        base_discount = _subscriber_discount(subtotal) if is_subscriber else Decimal("0.00")
        loyalty_credit = Decimal("0.00")
        if is_subscriber and (request.user.loyalty_points or 0) >= 100:
            loyalty_credit = Decimal("100.00")

        pre_total = subtotal + shipping_cost + tax + gift_box_total - base_discount
        if loyalty_credit > pre_total:
            loyalty_credit = pre_total

        discount = base_discount + loyalty_credit
        total = pre_total - loyalty_credit
        if total < 0:
            total = Decimal("0.00")

        # Create order
        order = Order.objects.create(
            user=request.user,
            payment_method=data.get('payment_method', 'mock'),
            notes=data.get('notes', ''),
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax=tax,
            discount=discount,
            gift_box_total=gift_box_total,
            total=total,
            **shipping_data
        )

        # Create order items + reduce stock
        for item in cart.items.select_related('product', 'variant_sku').all():
            primary_image = item.product.images.filter(is_primary=True).first() or item.product.images.first()
            image_url = ''
            if primary_image:
                try:
                    image_url = request.build_absolute_uri(primary_image.image.url)
                except Exception:
                    pass

            # Get variant description for display
            variant_description = ""
            if item.variant_sku:
                variant_parts = []
                for val in item.variant_sku.variant_values.all():
                    variant_parts.append(f"{val.variant_type.name}: {val.value}")
                variant_description = ", ".join(variant_parts)

            OrderItem.objects.create(
                order=order,
                product=item.product,
                variant_sku=item.variant_sku,
                product_name=item.product.name,
                product_sku=item.variant_sku.sku if item.variant_sku else item.product.sku,
                product_image=image_url,
                variant_description=variant_description,
                unit_price=item.unit_price,
                quantity=item.quantity,
            )
            
            # Reduce stock from appropriate location
            if item.variant_sku:
                item.variant_sku.reduce_stock(item.quantity)
            else:
                item.product.reduce_stock(item.quantity)

        loyalty_redeemed = loyalty_credit > 0

        # Persist gift box records to the database
        if gift_box_fees_data:
            from apps.gift_boxes.models import GiftBoxOrder
            for fee in gift_box_fees_data:
                ogb = OrderGiftBox.objects.create(
                    order=order,
                    gift_box_name=fee.get('name', 'Gift Box'),
                    gift_box_price=Decimal(str(fee.get('price', '0'))),
                )
                # Link the active GiftBoxOrder items (if order_id provided)
                fee_order_id = fee.get('order_id')
                if fee_order_id:
                    try:
                        gbo = GiftBoxOrder.objects.get(id=fee_order_id, user=request.user)
                        for gbi in gbo.items.select_related('product').all():
                            OrderGiftBoxItem.objects.create(
                                order_gift_box=ogb,
                                product=gbi.product,
                                product_name=gbi.product.name,
                                product_sku=gbi.product.sku or '',
                                quantity=gbi.quantity,
                            )
                        gbo.checked_out = True
                        gbo.save(update_fields=['checked_out'])
                    except GiftBoxOrder.DoesNotExist:
                        pass
                else:
                    # Fallback: link all cart items as box contents
                    for item in cart.items.select_related('product').all():
                        OrderGiftBoxItem.objects.create(
                            order_gift_box=ogb,
                            product=item.product,
                            product_name=item.product.name,
                            product_sku=item.product.sku or '',
                            quantity=item.quantity,
                        )

        # Save gift box records to the database (full snapshot per box)
        for fee in gift_box_fees_data:
            fee_name = fee.get('name', 'Gift Box')
            fee_price = Decimal('0.00')
            try:
                fee_price = Decimal(str(fee.get('price', '0')))
            except Exception:
                pass
            ogb = OrderGiftBox.objects.create(
                order=order,
                gift_box_name=fee_name,
                gift_box_price=fee_price,
            )
            # Snapshot every product currently in the cart as belonging to this box
            for cart_item in cart.items.select_related('product').all():
                OrderGiftBoxItem.objects.create(
                    order_gift_box=ogb,
                    product=cart_item.product,
                    product_name=cart_item.product.name,
                    product_sku=cart_item.product.sku or '',
                    quantity=cart_item.quantity,
                )

        # Handle payment workflows
        if order.payment_method in ['mock', 'cash_on_delivery']:
            if order.payment_method == 'mock':
                order.is_paid = True
                order.paid_at = timezone.now()
                order.status = 'paid'
                order.payment_id = f'MOCK-{order.order_number}'
                order.save()

            if loyalty_redeemed and (request.user.loyalty_points or 0) >= 100:
                request.user.loyalty_points = (request.user.loyalty_points or 0) - 100
                request.user.save(update_fields=['loyalty_points'])

        if order.payment_method == 'stripe':
            if not settings.STRIPE_SECRET_KEY:
                return Response({
                    'success': False,
                    'message': 'Stripe payment is not configured on server.'
                }, status=status.HTTP_400_BAD_REQUEST)
            try:
                import stripe
                stripe.api_key = settings.STRIPE_SECRET_KEY
                # Build Stripe line items: one for the order total + one per gift box fee
                stripe_line_items = [{
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': int((total - gift_box_total) * 100),
                        'product_data': {
                            'name': f'Order {order.order_number}',
                            'description': f'Products + shipping + tax (Grove)',
                        },
                    },
                    'quantity': 1,
                }]
                for fee in gift_box_fees_data:
                    fee_price = Decimal(str(fee.get('price', '0')))
                    if fee_price > 0:
                        stripe_line_items.append({
                            'price_data': {
                                'currency': 'usd',
                                'unit_amount': int(fee_price * 100),
                                'product_data': {
                                    'name': fee.get('name', 'Gift Box'),
                                    'description': 'Custom gift box wrapping fee',
                                },
                            },
                            'quantity': 1,
                        })
                checkout_session = stripe.checkout.Session.create(
                    mode='payment',
                    payment_method_types=['card'],
                    success_url=f"{settings.FRONTEND_URL}/account/orders/{order.order_number}?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
                    cancel_url=f"{settings.FRONTEND_URL}/checkout?payment=cancelled",
                    line_items=stripe_line_items,
                    metadata={'order_number': order.order_number, 'user_id': str(request.user.id), 'type': 'order_payment'}
                )
                order.payment_id = checkout_session.id
                order.save(update_fields=['payment_id'])
            except Exception as e:
                return Response({'success': False, 'message': f'Stripe checkout error: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        if order.payment_method != 'stripe':
            # Clear cart for non-Stripe flows.
            cart.clear()

        self._send_order_confirmation_email(order)

        response_payload = {
            'success': True,
            'message': 'Order placed successfully.',
            'order': OrderSerializer(order).data
        }
        if order.payment_method == 'stripe':
            response_payload.update({
                'requires_payment': True,
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id,
            })

        return Response(response_payload, status=status.HTTP_201_CREATED)

    def _calculate_shipping(self, subtotal, is_subscriber=False):
        if subtotal >= 100 or is_subscriber:
            return Decimal("0")  # free shipping over $100
        return Decimal("9.99")

    def _send_order_confirmation_email(self, order):
        if not order.user or not order.user.email:
            return
        send_mail(
            subject=f'Order Confirmation - {order.order_number}',
            message=(
                f"Hi {order.shipping_full_name},\n\n"
                f"Thanks for your order {order.order_number}.\n"
                f"Status: {order.status}\n"
                f"Total: ${order.total}\n\n"
                "We will notify you when your order status changes."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=True,
        )


class OrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

    def get_object(self):
        qs = self.get_queryset()
        return generics.get_object_or_404(qs, order_number=self.kwargs['order_number'])


class CancelOrderView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number, user=request.user)
        except Order.DoesNotExist:
            return Response({'success': False, 'message': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.is_paid:
            return Response({'success': True, 'message': 'Order already marked as paid.', 'order': OrderSerializer(order).data})

        if order.status not in ['pending', 'paid']:
            return Response({
                'success': False,
                'message': f'Cannot cancel order with status "{order.status}".'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Restore stock
        for item in order.items.select_related('product').all():
            if item.product:
                item.product.restore_stock(item.quantity)

        order.status = 'cancelled'
        order.save()

        return Response({'success': True, 'message': 'Order cancelled.', 'order': OrderSerializer(order).data})


# Admin Order Views
class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAdminUser,)
    filterset_fields = ('status', 'is_paid', 'payment_method')
    search_fields = ('order_number', 'user__email', 'shipping_full_name')
    ordering_fields = ('created_at', 'total', 'status')
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.select_related('user').prefetch_related('items')


class AdminOrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAdminUser,)
    lookup_field = 'order_number'


class AdminUpdateOrderStatusView(APIView):
    permission_classes = (permissions.IsAdminUser,)

    def patch(self, request, order_number):
        serializer = UpdateOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({'success': False, 'message': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = serializer.validated_data['status']
        order.status = new_status

        if new_status == 'paid' and not order.is_paid:
            order.is_paid = True
            order.paid_at = timezone.now()

        order.save()
        return Response({
            'success': True,
            'message': f'Order status updated to "{new_status}".',
            'order': OrderSerializer(order).data
        })


class AdminAnalyticsView(APIView):
    permission_classes = (permissions.IsAdminUser,)

    def get(self, request):
        from django.db.models import Sum, Count, Avg
        from django.db.models.functions import TruncMonth
        from apps.products.models import Product

        orders = Order.objects.filter(status__in=['paid', 'shipped', 'delivered'])

        total_revenue = orders.aggregate(total=Sum('total'))['total'] or 0
        total_orders = orders.count()
        avg_order_value = orders.aggregate(avg=Avg('total'))['avg'] or 0
        total_customers = Order.objects.values('user').distinct().count()

        # Revenue by month (last 12 months)
        from datetime import timedelta
        from django.utils import timezone
        twelve_months_ago = timezone.now() - timedelta(days=365)
        revenue_by_month = list(
            orders.filter(created_at__gte=twelve_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('total'), count=Count('id'))
            .order_by('month')
        )

        # Top selling products
        from apps.orders.models import OrderItem
        top_products = list(
            OrderItem.objects.values('product_name', 'product_id')
            .annotate(total_sold=Sum('quantity'), revenue=Sum('line_total'))
            .order_by('-total_sold')[:10]
        )

        # Orders by status
        orders_by_status = list(
            Order.objects.values('status').annotate(count=Count('id'))
        )

        return Response({
            'success': True,
            'analytics': {
                'total_revenue': float(total_revenue),
                'total_orders': total_orders,
                'avg_order_value': float(avg_order_value),
                'total_customers': total_customers,
                'revenue_by_month': [
                    {
                        'month': item['month'].strftime('%Y-%m'),
                        'revenue': float(item['revenue']),
                        'orders': item['count']
                    }
                    for item in revenue_by_month
                ],
                'top_products': top_products,
                'orders_by_status': orders_by_status,
            }
        })


class ConfirmStripePaymentView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request, order_number):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'success': False, 'message': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.STRIPE_SECRET_KEY:
            return Response({'success': False, 'message': 'Stripe is not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(order_number=order_number, user=request.user)
        except Order.DoesNotExist:
            return Response({'success': False, 'message': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status != 'paid':
                return Response({'success': False, 'message': 'Payment not completed yet.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'success': False, 'message': f'Unable to verify payment: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        order.is_paid = True
        order.status = 'paid'
        order.paid_at = timezone.now()
        order.payment_id = session_id
        order.save(update_fields=['is_paid', 'status', 'paid_at', 'payment_id'])

        # Redeem 100 loyalty points if this order used loyalty credit.
        if getattr(request.user, 'is_subscriber', False):
            expected_subscriber_discount = _subscriber_discount(order.subtotal)
            loyalty_part = order.discount - expected_subscriber_discount
            if loyalty_part > 0 and (request.user.loyalty_points or 0) >= 100:
                request.user.loyalty_points = (request.user.loyalty_points or 0) - 100
                request.user.save(update_fields=['loyalty_points'])

        # Clear cart after successful Stripe payment.
        try:
            cart = Cart.objects.get(user=request.user)
            cart.clear()
        except Cart.DoesNotExist:
            pass

        return Response({'success': True, 'message': 'Payment confirmed.', 'order': OrderSerializer(order).data})


class StripeWebhookView(APIView):
    """
    Stripe webhook endpoint — receives real-time payment events from Stripe.

    Set your webhook URL in the Stripe Dashboard to:
        https://yourdomain.com/api/orders/stripe/webhook/

    Required env var: STRIPE_WEBHOOK_SECRET (from the Stripe Dashboard webhook settings).
    """
    permission_classes = (permissions.AllowAny,)
    authentication_classes = []

    def post(self, request):
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
        if not webhook_secret or not settings.STRIPE_SECRET_KEY:
            return Response({'error': 'Stripe webhook not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except Exception as e:
            return Response({'error': f'Webhook signature verification failed: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get('type')

        if event_type == 'checkout.session.completed':
            session = event['data']['object']
            order_number = session.get('metadata', {}).get('order_number')
            payment_type = session.get('metadata', {}).get('type', '')

            if order_number and payment_type == 'order_payment':
                try:
                    with transaction.atomic():
                        order = Order.objects.get(order_number=order_number)
                        if not order.is_paid:
                            order.is_paid = True
                            order.status = 'paid'
                            order.paid_at = timezone.now()
                            order.payment_id = session.get('id', order.payment_id)
                            order.save(update_fields=['is_paid', 'status', 'paid_at', 'payment_id'])
                            # Clear cart
                            try:
                                cart = Cart.objects.get(user=order.user)
                                cart.clear()
                            except Cart.DoesNotExist:
                                pass
                except Order.DoesNotExist:
                    pass

        elif event_type == 'checkout.session.expired':
            session = event['data']['object']
            order_number = session.get('metadata', {}).get('order_number')
            if order_number:
                try:
                    order = Order.objects.get(order_number=order_number, is_paid=False)
                    order.status = 'cancelled'
                    order.save(update_fields=['status'])
                except Order.DoesNotExist:
                    pass

        return Response({'received': True})


class CalculateTotalView(APIView):
    """
    POST /api/orders/calculate-total/
    Returns the exact same breakdown the backend will use at checkout.
    Frontend uses this to show the real total before placing the order.
    Body: { gift_box_fees: [{name, price}] }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.cart.models import Cart
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = cart.subtotal
        gift_box_fees_data = request.data.get('gift_box_fees', [])
        gift_box_total = Decimal('0.00')
        for fee in gift_box_fees_data:
            try:
                gift_box_total += Decimal(str(fee.get('price', '0')))
            except Exception:
                pass

        is_subscriber = bool(getattr(request.user, 'is_subscriber', False))
        shipping_cost = Decimal('0') if subtotal >= 100 or is_subscriber else Decimal('9.99')
        tax = round(subtotal * Decimal('0.08'), 2)
        base_discount = round(subtotal * Decimal(str(getattr(settings, 'SUBSCRIBER_DISCOUNT_RATE', '0.15'))), 2) if is_subscriber else Decimal('0.00')
        loyalty_credit = Decimal('100.00') if is_subscriber and (getattr(request.user, 'loyalty_points', 0) or 0) >= 100 else Decimal('0.00')

        pre_total = subtotal + shipping_cost + tax + gift_box_total - base_discount
        if loyalty_credit > pre_total:
            loyalty_credit = pre_total
        total = pre_total - loyalty_credit
        if total < Decimal('0'):
            total = Decimal('0.00')

        return Response({
            'subtotal': str(subtotal),
            'shipping_cost': str(shipping_cost),
            'tax': str(tax),
            'gift_box_total': str(gift_box_total),
            'base_discount': str(base_discount),
            'loyalty_credit': str(loyalty_credit),
            'total': str(total),
            'is_subscriber': is_subscriber,
        })
