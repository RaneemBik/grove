from rest_framework import generics, status, permissions, filters, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count
from .models import Category, Product, ProductImage, Review, Banner, WishlistItem, SeasonalKit
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductDetailWithVariantsSerializer, ProductWriteSerializer, ProductImageSerializer,
    ReviewSerializer, BannerSerializer, WishlistItemSerializer, SeasonalKitSerializer
)


class SeasonalKitListView(generics.ListAPIView):
    """Returns all active seasonal kits with their products."""
    serializer_class = SeasonalKitSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        from .models import SeasonalKit
        return SeasonalKit.objects.filter(is_active=True).prefetch_related(
            'items__product__images', 'items__product__category'
        ).order_by('order', 'name')
from .filters import ProductFilter
from ecommerce.permissions import IsAdminOrReadOnly


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer
    permission_classes = (IsAdminOrReadOnly,)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (IsAdminOrReadOnly,)
    lookup_field = 'slug'


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'category__name', 'sku']
    ordering_fields = ['price', 'created_at', 'name', 'stock']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related('category').prefetch_related('images')
        user = self.request.user
        if not user.is_authenticated or not getattr(user, 'is_subscriber', False):
            qs = qs.filter(subscribers_only=False)
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailWithVariantsSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'slug'

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related('category').prefetch_related(
            'images', 'reviews__user', 'variant_config__variant_types__values', 'variant_skus__variant_values'
        )
        user = self.request.user
        if not user.is_authenticated or not getattr(user, 'is_subscriber', False):
            qs = qs.filter(subscribers_only=False)
        return qs


class FeaturedProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True, is_featured=True).select_related('category').prefetch_related('images')
        user = self.request.user
        if not user.is_authenticated or not getattr(user, 'is_subscriber', False):
            qs = qs.filter(subscribers_only=False)
        return qs[:8]


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return Review.objects.filter(product__slug=self.kwargs['slug'], is_approved=True)

    def perform_create(self, serializer):
        product = Product.objects.get(slug=self.kwargs['slug'])
        # Check if user already reviewed
        if Review.objects.filter(product=product, user=self.request.user).exists():
            raise serializers.ValidationError("You have already reviewed this product.")
        serializer.save(user=self.request.user, product=product)


class ReviewDeleteView(generics.DestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.is_staff:
            return Review.objects.all()
        return Review.objects.filter(user=self.request.user)


class BannerListView(generics.ListAPIView):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = (permissions.AllowAny,)


# Admin Product Views
class AdminProductListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAdminUser,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku', 'category__name']
    ordering_fields = ['price', 'stock', 'created_at']

    def get_queryset(self):
        return Product.objects.all().select_related('category').prefetch_related('images')

    def get_serializer_class(self):
        if self.request.method in ['POST']:
            return ProductWriteSerializer
        return ProductDetailSerializer


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    permission_classes = (permissions.IsAdminUser,)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductWriteSerializer
        return ProductDetailSerializer


class ProductImageUploadView(APIView):
    permission_classes = (permissions.IsAdminUser,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'success': False, 'message': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist('images')
        if not images:
            return Response({'success': False, 'message': 'No images provided.'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for i, image in enumerate(images):
            is_primary = not product.images.exists() and i == 0
            img = ProductImage.objects.create(product=product, image=image, is_primary=is_primary)
            created.append(ProductImageSerializer(img, context={'request': request}).data)

        return Response({'success': True, 'images': created}, status=status.HTTP_201_CREATED)

    def delete(self, request, product_id):
        image_id = request.data.get('image_id')
        try:
            image = ProductImage.objects.get(pk=image_id, product_id=product_id)
            image.delete()
            return Response({'success': True, 'message': 'Image deleted.'})
        except ProductImage.DoesNotExist:
            return Response({'success': False, 'message': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminInventoryView(generics.ListAPIView):
    permission_classes = (permissions.IsAdminUser,)
    serializer_class = ProductListSerializer

    def get_queryset(self):
        low_stock = self.request.query_params.get('low_stock')
        qs = Product.objects.filter(is_active=True).select_related('category')
        if low_stock:
            from django.db.models import F
            qs = qs.filter(stock__lte=F('low_stock_threshold'))
        return qs.order_by('stock')


class AdminBannerView(generics.ListCreateAPIView):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = (permissions.IsAdminUser,)


class AdminBannerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = (permissions.IsAdminUser,)


class WishlistListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = WishlistItemSerializer

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related('product', 'product__category')


class WishlistToggleView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'success': False, 'message': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        if not created:
            item.delete()
            return Response({'success': True, 'wishlisted': False, 'message': 'Removed from wishlist.'})

        return Response({'success': True, 'wishlisted': True, 'message': 'Added to wishlist.'}, status=status.HTTP_201_CREATED)


class WishlistDeleteView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)


class NewArrivalsView(generics.ListAPIView):
    """Returns products admin has marked as is_new_arrival=True."""
    serializer_class = ProductListSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True, is_new_arrival=True).select_related('category').prefetch_related('images')
        user = self.request.user
        if not user.is_authenticated or not getattr(user, 'is_subscriber', False):
            qs = qs.filter(subscribers_only=False)
        return qs.order_by('-created_at')[:12]


class SeasonalKitListView(generics.ListAPIView):
    """Returns all active seasonal kits with their items."""
    serializer_class = SeasonalKitSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        return SeasonalKit.objects.filter(is_active=True).prefetch_related(
            'items__product__images', 'items__product__category'
        ).order_by('order', 'name')
