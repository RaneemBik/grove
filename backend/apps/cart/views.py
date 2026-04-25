from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import CartSerializer, AddToCartSerializer, UpdateCartItemSerializer
from apps.products.models import Product, ProductVariantSKU


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        cart = get_or_create_cart(request.user)
        return Response({
            'success': True,
            'cart': CartSerializer(cart, context={'request': request}).data
        })

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.clear()
        return Response({'success': True, 'message': 'Cart cleared.'})


class AddToCartView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        variant_sku_id = serializer.validated_data.get('variant_sku_id')

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'success': False, 'message': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Handle variant selection
        variant_sku = None
        if variant_sku_id:
            try:
                variant_sku = ProductVariantSKU.objects.get(pk=variant_sku_id, product=product, is_active=True)
                effective_stock = variant_sku.stock
            except ProductVariantSKU.DoesNotExist:
                return Response({'success': False, 'message': 'Product variant not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            effective_stock = product.stock

        if effective_stock < quantity:
            return Response({
                'success': False,
                'message': f'Only {effective_stock} item(s) available in stock.'
            }, status=status.HTTP_400_BAD_REQUEST)

        cart = get_or_create_cart(request.user)
        
        # Create or get cart item based on product and variant combo
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, 
            product=product,
            variant_sku=variant_sku
        )

        if not created:
            new_qty = cart_item.quantity + quantity
            if effective_stock < new_qty:
                return Response({
                    'success': False,
                    'message': f'Cannot add more. Only {effective_stock} item(s) available.'
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_qty
            cart_item.save()
        else:
            cart_item.quantity = quantity
            cart_item.save()

        return Response({
            'success': True,
            'message': 'Item added to cart.',
            'cart': CartSerializer(cart, context={'request': request}).data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CartItemUpdateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data['quantity']

        try:
            cart = Cart.objects.get(user=request.user)
            item = CartItem.objects.get(pk=item_id, cart=cart)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({'success': False, 'message': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check stock based on whether it's a variant or base product
        effective_stock = item.variant_sku.stock if item.variant_sku else item.product.stock
        
        if effective_stock < quantity:
            return Response({
                'success': False,
                'message': f'Only {effective_stock} item(s) available.'
            }, status=status.HTTP_400_BAD_REQUEST)

        item.quantity = quantity
        item.save()

        return Response({
            'success': True,
            'message': 'Cart updated.',
            'cart': CartSerializer(cart, context={'request': request}).data
        })

    def delete(self, request, item_id):
        try:
            cart = Cart.objects.get(user=request.user)
            item = CartItem.objects.get(pk=item_id, cart=cart)
            item.delete()
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({'success': False, 'message': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'message': 'Item removed from cart.',
            'cart': CartSerializer(cart, context={'request': request}).data
        })


class AddKitToCartView(APIView):
    """
    POST /api/cart/add-kit/
    Adds all in-stock products from a seasonal kit to the user's cart
    and records a KitCartOrder so admin can see what kit was ordered.
    Body: { kit_slug: str }
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        from apps.products.models import SeasonalKit
        from .models import KitCartOrder

        kit_slug = request.data.get('kit_slug', '').strip()
        if not kit_slug:
            return Response({'success': False, 'message': 'kit_slug is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            kit = SeasonalKit.objects.prefetch_related('items__product').get(slug=kit_slug, is_active=True)
        except SeasonalKit.DoesNotExist:
            return Response({'success': False, 'message': 'Kit not found.'}, status=status.HTTP_404_NOT_FOUND)

        cart = get_or_create_cart(request.user)
        added_names = []
        skipped_names = []

        for kit_item in kit.items.select_related('product').all():
            product = kit_item.product
            if not product.is_active or product.stock < 1:
                skipped_names.append(product.name)
                continue

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                variant_sku=None,
            )
            if not created:
                new_qty = cart_item.quantity + 1
                if product.stock >= new_qty:
                    cart_item.quantity = new_qty
                    cart_item.save()
            else:
                cart_item.quantity = 1
                cart_item.save()

            added_names.append(product.name)

        if not added_names:
            return Response({
                'success': False,
                'message': 'No in-stock products could be added from this kit.',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Record the kit order for admin tracking
        KitCartOrder.objects.create(
            user=request.user,
            kit_slug=kit.slug,
            kit_name=kit.name,
            product_names=', '.join(added_names),
        )

        msg = f"Added {len(added_names)} product(s) from '{kit.name}' to your cart."
        if skipped_names:
            msg += f" {len(skipped_names)} out-of-stock item(s) skipped."

        return Response({
            'success': True,
            'message': msg,
            'added_count': len(added_names),
            'skipped_count': len(skipped_names),
            'cart': CartSerializer(cart, context={'request': request}).data,
        }, status=status.HTTP_200_OK)
