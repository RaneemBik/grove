from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView,
    ProductListView, ProductDetailView, FeaturedProductsView, NewArrivalsView,
    ReviewListCreateView, ReviewDeleteView,
    BannerListView,
    AdminProductListCreateView, AdminProductDetailView,
    ProductImageUploadView, AdminInventoryView,
    AdminBannerView, AdminBannerDetailView,
    WishlistListView, WishlistToggleView, WishlistDeleteView,
    SeasonalKitListView,
)

urlpatterns = [
    # Public
    path('', ProductListView.as_view(), name='product_list'),
    path('featured/', FeaturedProductsView.as_view(), name='featured_products'),
    path('new-arrivals/', NewArrivalsView.as_view(), name='new_arrivals'),
    path('seasonal-kits/', SeasonalKitListView.as_view(), name='seasonal_kits'),
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category_detail'),
    path('<slug:slug>/reviews/', ReviewListCreateView.as_view(), name='product_reviews'),
    path('reviews/<int:pk>/', ReviewDeleteView.as_view(), name='review_delete'),
    path('banners/active/', BannerListView.as_view(), name='banner_list'),
    path('wishlist/', WishlistListView.as_view(), name='wishlist_list'),
    path('wishlist/toggle/<int:product_id>/', WishlistToggleView.as_view(), name='wishlist_toggle'),
    path('wishlist/<int:pk>/', WishlistDeleteView.as_view(), name='wishlist_delete'),
    path('<slug:slug>/', ProductDetailView.as_view(), name='product_detail'),
    # Admin
    path('admin/products/', AdminProductListCreateView.as_view(), name='admin_product_list'),
    path('admin/products/<int:pk>/', AdminProductDetailView.as_view(), name='admin_product_detail'),
    path('admin/products/<int:product_id>/images/', ProductImageUploadView.as_view(), name='product_images'),
    path('admin/inventory/', AdminInventoryView.as_view(), name='admin_inventory'),
    path('admin/banners/', AdminBannerView.as_view(), name='admin_banners'),
    path('admin/banners/<int:pk>/', AdminBannerDetailView.as_view(), name='admin_banner_detail'),
]
