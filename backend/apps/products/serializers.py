from rest_framework import serializers
from .models import Category, Product, ProductImage, Review, Banner, WishlistItem, ProductVariantType, ProductVariantValue, ProductVariant, ProductVariantSKU


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'parent', 'children', 'is_active', 'product_count')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_primary', 'order')


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ('id', 'user', 'user_name', 'rating', 'title', 'comment', 'is_approved', 'created_at')
        read_only_fields = ('id', 'user', 'is_approved', 'created_at')

    def get_user_name(self, obj):
        return obj.user.full_name or obj.user.username


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    is_wishlisted = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'category', 'category_name', 'short_description',
                  'price', 'compare_price', 'discount_percentage', 'stock', 'is_in_stock',
                  'is_featured', 'is_new_arrival', 'subscribers_only', 'primary_image', 'average_rating', 'review_count',
                  'is_wishlisted', 'created_at')

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        if image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image.image.url)
            return image.image.url
        return None

    def get_is_wishlisted(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return WishlistItem.objects.filter(user=user, product=obj).exists()


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    is_wishlisted = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'category', 'description', 'short_description',
                  'price', 'compare_price', 'discount_percentage', 'sku', 'stock',
                  'is_in_stock', 'is_low_stock', 'is_featured', 'subscribers_only', 'is_active',
                  'weight', 'images', 'reviews', 'average_rating', 'review_count', 'is_wishlisted', 'created_at')

    def get_reviews(self, obj):
        reviews = obj.reviews.filter(is_approved=True)[:10]
        return ReviewSerializer(reviews, many=True).data

    def get_is_wishlisted(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return WishlistItem.objects.filter(user=user, product=obj).exists()


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('name', 'slug', 'category', 'description', 'short_description',
                  'price', 'compare_price', 'sku', 'stock', 'low_stock_threshold',
                  'is_active', 'is_featured', 'subscribers_only', 'weight')


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ('id', 'product', 'created_at')


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = '__all__'


# ===== VARIANT SERIALIZERS =====

class ProductVariantValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariantValue
        fields = ('id', 'value', 'color_hex', 'image', 'order')


class ProductVariantTypeSerializer(serializers.ModelSerializer):
    values = ProductVariantValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariantType
        fields = ('id', 'name', 'slug', 'display_name', 'values', 'is_active')


class ProductVariantSKUSerializer(serializers.ModelSerializer):
    variant_values = serializers.SerializerMethodField()
    effective_price = serializers.ReadOnlyField()
    effective_short_description = serializers.ReadOnlyField()
    effective_description = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariantSKU
        fields = (
            'id', 'sku', 'variant_values', 'price', 'compare_price', 'effective_price',
            'short_description', 'description', 'effective_short_description', 'effective_description',
            'size_length_cm', 'size_width_cm', 'stock', 'is_in_stock', 'is_low_stock',
            'image', 'is_active', 'created_at'
        )

    def get_variant_values(self, obj):
        """Return variant values with their type info for UI display"""
        values_data = []
        for val in obj.variant_values.all():
            values_data.append({
                'id': val.id,
                'type_name': val.variant_type.name,
                'value': val.value,
                'color_hex': val.color_hex,
                'image': val.image.url if val.image else None
            })
        return values_data


class ProductVariantSerializer(serializers.ModelSerializer):
    variant_types = ProductVariantTypeSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariant
        fields = ('id', 'variant_types', 'is_active')


class ProductDetailWithVariantsSerializer(serializers.ModelSerializer):
    """Extended product serializer that includes variant info"""
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    is_wishlisted = serializers.SerializerMethodField()
    variant_config = ProductVariantSerializer(read_only=True)
    variant_skus = ProductVariantSKUSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'category', 'description', 'short_description',
                  'price', 'compare_price', 'discount_percentage', 'sku', 'stock',
                  'is_in_stock', 'is_low_stock', 'is_featured', 'subscribers_only', 'is_active',
                  'weight', 'images', 'reviews', 'average_rating', 'review_count', 'is_wishlisted',
                  'variant_config', 'variant_skus', 'created_at')

    def get_reviews(self, obj):
        reviews = obj.reviews.filter(is_approved=True)[:10]
        return ReviewSerializer(reviews, many=True).data

    def get_is_wishlisted(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return WishlistItem.objects.filter(user=user, product=obj).exists()


class SeasonalKitItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = __import__('apps.products.models', fromlist=['SeasonalKitItem']).SeasonalKitItem
        fields = ['id', 'product', 'note', 'order']


class SeasonalKitSerializer(serializers.ModelSerializer):
    items = SeasonalKitItemSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = __import__('apps.products.models', fromlist=['SeasonalKit']).SeasonalKit
        fields = ['id', 'name', 'slug', 'description', 'badge', 'image_url', 'item_count', 'items', 'order', 'is_active']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
