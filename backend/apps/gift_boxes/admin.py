from django.contrib import admin
from django.utils.html import format_html
from .models import GiftBox, GiftBoxOrder, GiftBoxItem


class GiftBoxItemInline(admin.TabularInline):
    model = GiftBoxItem
    extra = 0
    readonly_fields = ('product', 'quantity')


@admin.register(GiftBox)
class GiftBoxAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'max_items', 'is_active', 'image_preview', 'created_at')
    list_editable = ('price', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    list_filter = ('is_active',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:60px;border-radius:8px;"/>', obj.image.url)
        return '—'
    image_preview.short_description = 'Preview'


@admin.register(GiftBoxOrder)
class GiftBoxOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'gift_box', 'user', 'checked_out', 'created_at')
    list_filter = ('checked_out', 'gift_box')
    inlines = [GiftBoxItemInline]
    readonly_fields = ('created_at', 'updated_at')
