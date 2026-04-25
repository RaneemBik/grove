from rest_framework import serializers
from .models import GiftBox, GiftBoxOrder, GiftBoxItem
from apps.products.serializers import ProductListSerializer


class GiftBoxSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GiftBox
        fields = ['id', 'name', 'slug', 'description', 'price', 'image_url', 'max_items', 'is_active']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class GiftBoxItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = GiftBoxItem
        fields = ['id', 'product', 'product_id', 'quantity']


class GiftBoxOrderSerializer(serializers.ModelSerializer):
    items = GiftBoxItemSerializer(many=True, read_only=True)
    gift_box = GiftBoxSerializer(read_only=True)
    gift_box_id = serializers.IntegerField(write_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = GiftBoxOrder
        fields = ['id', 'gift_box', 'gift_box_id', 'items', 'total_price', 'checked_out', 'created_at']
        read_only_fields = ['checked_out', 'created_at', 'total_price']