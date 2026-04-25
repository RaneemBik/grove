from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import (
    Category, Product, ProductImage, Review, Banner, WishlistItem,
    ProductVariantType, ProductVariantValue, ProductVariant, ProductVariantSKU,
    SeasonalKit, SeasonalKitItem,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:60px;border-radius:6px;"/>', obj.image.url)
        return '-'
    image_preview.short_description = 'Preview'


class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    readonly_fields = ('user', 'rating', 'comment', 'created_at')
    can_delete = True


class ProductVariantSKUInline(admin.StackedInline):
    model = ProductVariantSKU
    extra = 1
    fields = (
        'sku', 'variant_values',
        'price', 'compare_price',
        'short_description', 'description',
        ('size_length_cm', 'size_width_cm'),
        ('stock', 'low_stock_threshold'),
        'image', 'is_active'
    )


class ProductVariantInline(admin.StackedInline):
    model = ProductVariant
    extra = 0
    max_num = 1
    can_delete = False
    fields = ('variant_types', 'is_active')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'is_active', 'product_count')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'category', 'price', 'stock',
        'stock_status', 'is_active', 'is_featured', 'is_new_arrival',
        'subscribers_only', 'created_at'
    )
    list_filter = ('is_active', 'is_featured', 'is_new_arrival', 'subscribers_only', 'category')
    search_fields = ('name', 'sku', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('price', 'stock', 'is_active', 'is_featured', 'is_new_arrival', 'subscribers_only')
    inlines = [ProductImageInline, ProductVariantInline, ProductVariantSKUInline, ReviewInline]
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Basic Info', {'fields': ('name', 'slug', 'category', 'sku')}),
        ('Descriptions', {'fields': ('short_description', 'description')}),
        ('Pricing', {'fields': ('price', 'compare_price')}),
        ('Inventory', {'fields': ('stock', 'low_stock_threshold', 'weight')}),
        ('Status', {'fields': ('is_active', 'is_featured', 'is_new_arrival', 'subscribers_only')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def stock_status(self, obj):
        if obj.stock == 0:
            return mark_safe('<span style="color:red;font-weight:bold;">Out of Stock</span>')
        elif obj.is_low_stock:
            return format_html('<span style="color:orange;font-weight:bold;">Low ({})</span>', obj.stock)
        return format_html('<span style="color:green;">In Stock ({})</span>', obj.stock)
    stock_status.short_description = 'Stock Status'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_approved')
    list_editable = ('is_approved',)
    search_fields = ('product__name', 'user__email', 'comment')


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'order')
    list_editable = ('is_active', 'order')


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'product__name', 'product__sku')


# ── Variant admins ──────────────────────────────────────────────────────────

@admin.register(ProductVariantType)
class ProductVariantTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


class ProductVariantValueInline(admin.TabularInline):
    model = ProductVariantValue
    extra = 1
    fields = ('value', 'color_hex', 'order', 'is_active')


@admin.register(ProductVariantValue)
class ProductVariantValueAdmin(admin.ModelAdmin):
    list_display = ('value', 'variant_type', 'color_hex', 'order', 'is_active')
    list_filter = ('variant_type', 'is_active')
    search_fields = ('value', 'variant_type__name')
    list_editable = ('order', 'is_active')


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('product__name',)
    filter_horizontal = ('variant_types',)


@admin.register(ProductVariantSKU)
class ProductVariantSKUAdmin(admin.ModelAdmin):
    list_display = ('sku', 'product', 'stock', 'is_in_stock', 'price', 'is_active')
    list_filter = ('product', 'is_active', 'stock')
    search_fields = ('sku', 'product__name')
    list_editable = ('stock', 'is_active', 'price')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('variant_values',)
    fieldsets = (
        ('Product & SKU', {'fields': ('product', 'sku')}),
        ('Variants', {'fields': ('variant_values',)}),
        ('Pricing', {'fields': ('price', 'compare_price')}),
        ('Variant Content', {'fields': ('short_description', 'description')}),
        ('Size Details (Optional)', {'fields': ('size_length_cm', 'size_width_cm')}),
        ('Inventory', {'fields': ('stock', 'low_stock_threshold')}),
        ('Media', {'fields': ('image',)}),
        ('Status', {'fields': ('is_active',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


# ── Seasonal Kits ────────────────────────────────────────────────────────────

class SeasonalKitItemInline(admin.TabularInline):
    model = SeasonalKitItem
    extra = 1
    fields = ('product', 'note', 'order')
    autocomplete_fields = ('product',)
    ordering = ('order',)

    def get_extra(self, request, obj=None, **kwargs):
        return 0 if obj and obj.items.exists() else 3


@admin.register(SeasonalKit)
class SeasonalKitAdmin(admin.ModelAdmin):
    list_display = ('name', 'badge', 'item_count_display', 'is_active', 'order', 'kit_image_preview', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_active', 'order')
    inlines = [SeasonalKitItemInline]
    readonly_fields = ('kit_image_preview', 'created_at', 'updated_at')

    fieldsets = (
        ('Kit Info', {'fields': ('name', 'slug', 'badge', 'description')}),
        ('Media', {'fields': ('image', 'kit_image_preview')}),
        ('Visibility', {'fields': ('is_active', 'order')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def item_count_display(self, obj):
        count = obj.items.count()
        return format_html('<b>{}</b> product{}', count, 's' if count != 1 else '')
    item_count_display.short_description = 'Items'

    def kit_image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:80px;border-radius:10px;"/>', obj.image.url)
        return mark_safe('<span style="color:#999;">No image</span>')
    kit_image_preview.short_description = 'Preview'
