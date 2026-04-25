from django.contrib import admin
from django.utils.html import format_html
from .models import Cart, CartItem, KitCartOrder


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('product', 'variant_sku', 'quantity', 'unit_price_display', 'line_total_display', 'added_at')
    can_delete = False

    def unit_price_display(self, obj):
        return f"${obj.unit_price}"
    unit_price_display.short_description = 'Unit Price'

    def line_total_display(self, obj):
        return f"${obj.line_total}"
    line_total_display.short_description = 'Line Total'


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_items_display', 'subtotal_display', 'updated_at')
    readonly_fields = ('user', 'created_at', 'updated_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    inlines = [CartItemInline]

    def total_items_display(self, obj):
        return obj.total_items
    total_items_display.short_description = 'Items'

    def subtotal_display(self, obj):
        return f"${obj.subtotal}"
    subtotal_display.short_description = 'Subtotal'


@admin.register(KitCartOrder)
class KitCartOrderAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'kit_name', 'item_count', 'product_list_preview', 'added_at')
    list_filter = ('kit_name', 'added_at')
    search_fields = ('user__email', 'kit_name', 'product_names')
    readonly_fields = ('user', 'kit_slug', 'kit_name', 'product_names', 'added_at', 'products_formatted')
    ordering = ('-added_at',)

    fieldsets = (
        ('Customer', {'fields': ('user',)}),
        ('Kit Details', {'fields': ('kit_name', 'kit_slug')}),
        ('Products in Kit', {'fields': ('products_formatted',)}),
        ('Timestamp', {'fields': ('added_at',)}),
    )

    def user_email(self, obj):
        return format_html(
            '<a href="/admin/auth/user/{}/change/">{}</a>',
            obj.user.id, obj.user.email
        )
    user_email.short_description = 'Customer'

    def item_count(self, obj):
        names = [n.strip() for n in obj.product_names.split(',') if n.strip()]
        return len(names)
    item_count.short_description = 'Products'

    def product_list_preview(self, obj):
        names = [n.strip() for n in obj.product_names.split(',') if n.strip()]
        preview = ', '.join(names[:3])
        if len(names) > 3:
            preview += f' ... +{len(names) - 3} more'
        return preview
    product_list_preview.short_description = 'Products Added'

    def products_formatted(self, obj):
        names = [n.strip() for n in obj.product_names.split(',') if n.strip()]
        items_html = ''.join(
            f'<li style="padding:4px 0;border-bottom:1px solid #eee;">{name}</li>'
            for name in names
        )
        return format_html(
            '<ul style="margin:0;padding:0 0 0 16px;list-style:disc;">{}</ul>',
            format_html(items_html)
        )
    products_formatted.short_description = 'All Products in Kit'
