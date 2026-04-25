from rest_framework import serializers
from .models import Order, OrderItem
from apps.users.models import Address


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_sku', 'product_image',
                  'unit_price', 'quantity', 'line_total')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'user', 'user_email', 'status',
            'payment_method', 'payment_id', 'is_paid', 'paid_at',
            'shipping_full_name', 'shipping_phone', 'shipping_street',
            'shipping_apartment', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_country',
            'subtotal', 'shipping_cost', 'tax', 'discount', 'gift_box_total', 'total',
            'notes', 'items', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'order_number', 'user', 'subtotal', 'total', 'created_at', 'updated_at')

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ('id', 'order_number', 'status', 'total', 'item_count', 'is_paid', 'created_at')

    def get_item_count(self, obj):
        return obj.items.count()


class CheckoutSerializer(serializers.Serializer):
    # Shipping address - either address_id or inline fields
    address_id = serializers.IntegerField(required=False)
    shipping_full_name = serializers.CharField(max_length=100, required=False)
    shipping_phone = serializers.CharField(max_length=20, required=False)
    shipping_street = serializers.CharField(max_length=255, required=False)
    shipping_apartment = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100, required=False)
    shipping_state = serializers.CharField(max_length=100, required=False)
    shipping_postal_code = serializers.CharField(max_length=20, required=False)
    shipping_country = serializers.CharField(max_length=100, required=False)
    payment_method = serializers.ChoiceField(
        choices=['credit_card', 'paypal', 'stripe', 'cash_on_delivery', 'mock'],
        default='mock'
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    # Gift box fees: list of {name: str, price: str} objects passed from the frontend
    gift_box_fees = serializers.ListField(child=serializers.DictField(), required=False, default=list)

    def validate(self, attrs):
        if not attrs.get('address_id'):
            required_fields = ['shipping_full_name', 'shipping_phone', 'shipping_street',
                               'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_country']
            missing = [f for f in required_fields if not attrs.get(f)]
            if missing:
                raise serializers.ValidationError({
                    'shipping': f"Required fields missing: {', '.join(missing)}"
                })
        return attrs


class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[s[0] for s in Order.STATUS_CHOICES])
