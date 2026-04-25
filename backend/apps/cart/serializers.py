from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.serializers import ProductListSerializer, ProductVariantSKUSerializer


class CartItemVariantInfoSerializer(serializers.Serializer):
    """Nested serializer for variant information in cart items"""
    type_name = serializers.CharField()
    value = serializers.CharField()
    color_hex = serializers.CharField(required=False, allow_blank=True)


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    variant_sku = ProductVariantSKUSerializer(read_only=True)
    variant_sku_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    unit_price = serializers.ReadOnlyField()
    line_total = serializers.ReadOnlyField()
    variant_display = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'variant_sku', 'variant_sku_id', 
                  'quantity', 'unit_price', 'line_total', 'variant_display', 'added_at')
        read_only_fields = ('id', 'added_at')

    def get_variant_display(self, obj):
        """Return a human-readable variant description"""
        if not obj.variant_sku:
            return None
        variants_info = []
        for val in obj.variant_sku.variant_values.all():
            variants_info.append(f"{val.variant_type.name}: {val.value}")
        return ", ".join(variants_info) if variants_info else None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total_items', 'subtotal', 'updated_at')


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    variant_sku_id = serializers.IntegerField(required=False, allow_null=True)  # Optional for products with variants


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
