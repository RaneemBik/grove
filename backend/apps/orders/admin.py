from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django.urls import reverse
from .models import Order, OrderItem, OrderGiftBox, OrderGiftBoxItem


# ── Inline: regular order items ──────────────────────────────────────────────

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    fields = ('item_summary', 'product_sku', 'variant_description', 'quantity', 'unit_price', 'line_total')
    readonly_fields = ('item_summary', 'product_sku', 'variant_description', 'quantity', 'unit_price', 'line_total')

    def item_summary(self, obj):
        img_html = ''
        if obj.product_image:
            from django.conf import settings
            img_url = obj.product_image if obj.product_image.startswith('http') else (
                settings.MEDIA_URL + obj.product_image
            )
            img_html = f'<img src="{img_url}" style="height:48px;width:48px;object-fit:cover;border-radius:6px;margin-right:10px;vertical-align:middle;" />'

        name = obj.product_name or '—'
        if obj.product_id:
            try:
                url = reverse('admin:products_product_change', args=[obj.product_id])
                name = f'<a href="{url}" style="font-weight:600;color:#1a2e1a;">{obj.product_name}</a>'
            except Exception:
                name = f'<strong>{obj.product_name}</strong>'
        return mark_safe(f'<div style="display:flex;align-items:center;">{img_html}{name}</div>')
    item_summary.short_description = 'Product'

    def has_add_permission(self, request, obj=None):
        return False


# ── Inline: gift box items (shown inside gift box inline) ────────────────────

class OrderGiftBoxItemInline(admin.TabularInline):
    model = OrderGiftBoxItem
    extra = 0
    can_delete = False
    fields = ('item_preview', 'product_sku', 'quantity')
    readonly_fields = ('item_preview', 'product_sku', 'quantity')

    def item_preview(self, obj):
        name = obj.product_name or '—'
        if obj.product_id:
            try:
                url = reverse('admin:products_product_change', args=[obj.product_id])
                name = f'<a href="{url}" style="font-weight:600;color:#1a4035;">{obj.product_name}</a>'
            except Exception:
                name = f'<strong>{obj.product_name}</strong>'
        return mark_safe(name)
    item_preview.short_description = 'Product in Box'

    def has_add_permission(self, request, obj=None):
        return False


# ── Custom inline that renders a full gift-box block with its products ────────

class OrderGiftBoxInline(admin.StackedInline):
    model = OrderGiftBox
    extra = 0
    can_delete = False
    fields = ('gift_box_summary',)
    readonly_fields = ('gift_box_summary',)
    verbose_name = 'Gift Box'
    verbose_name_plural = 'Gift Boxes ordered'

    def gift_box_summary(self, obj):
        items = obj.items.select_related('product').all()
        rows = ''
        for item in items:
            name = item.product_name
            if item.product_id:
                try:
                    url = reverse('admin:products_product_change', args=[item.product_id])
                    name = f'<a href="{url}" style="color:#1a4035;font-weight:600;">{item.product_name}</a>'
                except Exception:
                    pass
            sku_part = f' <span style="color:#999;font-size:11px;">({item.product_sku})</span>' if item.product_sku else ''
            rows += (
                f'<tr>'
                f'<td style="padding:7px 12px;border-bottom:1px solid #eee;">{name}{sku_part}</td>'
                f'<td style="padding:7px 12px;border-bottom:1px solid #eee;text-align:center;">x{item.quantity}</td>'
                f'</tr>'
            )

        if not rows:
            rows = '<tr><td colspan="2" style="padding:10px;color:#999;font-style:italic;">No products recorded inside this box.</td></tr>'

        return mark_safe(f'''
        <div style="background:#f0f7f4;border:1.5px solid #4caf7d;border-radius:10px;padding:16px;margin:4px 0;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <span style="font-size:22px;">🎁</span>
            <div>
              <strong style="font-size:15px;color:#1a4035;">{obj.gift_box_name}</strong>
              <span style="margin-left:12px;background:#1a4035;color:#c5e84a;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;">${obj.gift_box_price}</span>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#e8f5ee;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;font-weight:600;">Product inside box</th>
                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#555;font-weight:600;">Qty</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
        ''')
    gift_box_summary.short_description = 'Box Contents'

    def has_add_permission(self, request, obj=None):
        return False


# ── Main Order admin ──────────────────────────────────────────────────────────

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 'customer_info', 'order_items_preview',
        'colored_status', 'payment_method_display', 'total_display',
        'has_gift_box', 'is_paid', 'created_at',
    )
    list_filter = ('status', 'payment_method', 'is_paid', 'created_at')
    search_fields = ('order_number', 'user__email', 'shipping_full_name', 'items__product_name')
    ordering = ('-created_at',)
    readonly_fields = (
        'order_number', 'user', 'subtotal', 'total', 'gift_box_total',
        'created_at', 'updated_at', 'paid_at', 'full_order_summary',
    )
    inlines = [OrderItemInline, OrderGiftBoxInline]

    fieldsets = (
        ('Order Overview', {'fields': ('order_number', 'user', 'status', 'notes', 'full_order_summary')}),
        ('Payment', {'fields': ('payment_method', 'payment_id', 'is_paid', 'paid_at')}),
        ('Shipping Address', {'fields': (
            'shipping_full_name', 'shipping_phone', 'shipping_street',
            'shipping_apartment', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_country',
        )}),
        ('Pricing Breakdown', {'fields': ('subtotal', 'shipping_cost', 'tax', 'discount', 'gift_box_total', 'total')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    # ── List display helpers ──────────────────────────────────────────────────

    def customer_info(self, obj):
        email = obj.user.email if obj.user else 'Deleted user'
        name = obj.shipping_full_name or ''
        city = obj.shipping_city or ''
        country = obj.shipping_country or ''
        location = ', '.join(filter(None, [city, country]))
        return mark_safe(
            f'<div style="line-height:1.5;">'
            f'<strong style="color:#1a2e1a;">{email}</strong><br>'
            f'<span style="color:#666;font-size:12px;">{name}</span><br>'
            f'<span style="color:#999;font-size:11px;">{location}</span>'
            f'</div>'
        )
    customer_info.short_description = 'Customer'

    def order_items_preview(self, obj):
        items = list(obj.items.all()[:5])
        boxes = list(obj.gift_boxes.all()[:2])

        if not items and not boxes:
            return mark_safe('<span style="color:#999;font-style:italic;">No items</span>')

        lines = []
        for item in items:
            lines.append(
                f'<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">'
                f'<span style="background:#e8f5ee;color:#1a4035;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:700;">{item.quantity}x</span>'
                f'<span style="font-size:12px;color:#333;">{item.product_name}</span>'
                f'</div>'
            )

        for box in boxes:
            box_items = list(box.items.all()[:4])
            box_products = ', '.join(bi.product_name for bi in box_items)
            if box.items.count() > 4:
                box_products += f' +{box.items.count() - 4} more'
            lines.append(
                f'<div style="margin-top:4px;background:#f0f7f4;border-left:3px solid #4caf7d;padding:4px 8px;border-radius:0 6px 6px 0;">'
                f'<span style="font-size:11px;font-weight:700;color:#1a4035;">GIFT BOX: {box.gift_box_name}</span><br>'
                f'<span style="font-size:11px;color:#555;">{box_products or "No items"}</span>'
                f'</div>'
            )

        extra = obj.items.count() - 5
        if extra > 0:
            lines.append(f'<div style="font-size:11px;color:#999;margin-top:2px;">+{extra} more products</div>')

        return mark_safe(''.join(lines))
    order_items_preview.short_description = 'What was ordered'

    def colored_status(self, obj):
        colors = {
            'pending': ('#fff3cd', '#856404'),
            'paid': ('#cce5ff', '#004085'),
            'processing': ('#e2d9f3', '#432874'),
            'shipped': ('#d1ecf1', '#0c5460'),
            'delivered': ('#d4edda', '#155724'),
            'cancelled': ('#f8d7da', '#721c24'),
            'refunded': ('#e2e3e5', '#383d41'),
        }
        bg, fg = colors.get(obj.status, ('#eee', '#333'))
        return mark_safe(
            f'<span style="background:{bg};color:{fg};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;">'
            f'{obj.get_status_display()}</span>'
        )
    colored_status.short_description = 'Status'

    def payment_method_display(self, obj):
        labels = {
            'stripe': 'Stripe', 'mock': 'Demo',
            'cash_on_delivery': 'COD', 'credit_card': 'Card', 'paypal': 'PayPal',
        }
        return labels.get(obj.payment_method, obj.payment_method)
    payment_method_display.short_description = 'Payment'

    def total_display(self, obj):
        box_note = ''
        if obj.gift_box_total:
            box_note = f'<br><span style="font-size:10px;color:#4caf7d;">incl. ${obj.gift_box_total} box fee</span>'
        return mark_safe(
            f'<strong style="font-size:14px;color:#1a2e1a;">${obj.total}</strong>{box_note}'
        )
    total_display.short_description = 'Total'

    def has_gift_box(self, obj):
        count = obj.gift_boxes.count()
        if count:
            return mark_safe(
                f'<span style="background:#f0f7f4;color:#1a4035;border:1px solid #4caf7d;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">'
                f'Yes ({count})</span>'
            )
        return mark_safe('<span style="color:#ccc;font-size:11px;">—</span>')
    has_gift_box.short_description = 'Gift Box'

    # ── Detail page full summary ──────────────────────────────────────────────

    def full_order_summary(self, obj):
        """Renders a rich HTML summary of all products + gift boxes for the detail page."""
        # Regular products section
        items = obj.items.select_related('product').all()
        product_rows = ''
        for item in items:
            name = item.product_name
            if item.product_id:
                try:
                    url = reverse('admin:products_product_change', args=[item.product_id])
                    name = f'<a href="{url}" style="font-weight:600;color:#1a2e1a;">{item.product_name}</a>'
                except Exception:
                    name = f'<strong>{item.product_name}</strong>'

            img_html = ''
            if item.product_image:
                from django.conf import settings
                img_url = item.product_image if item.product_image.startswith('http') else settings.MEDIA_URL + item.product_image
                img_html = f'<img src="{img_url}" style="height:44px;width:44px;object-fit:cover;border-radius:6px;margin-right:10px;" />'

            variant = f'<br><span style="font-size:11px;color:#888;">{item.variant_description}</span>' if item.variant_description else ''
            product_rows += (
                f'<tr>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">'
                f'  <div style="display:flex;align-items:center;">{img_html}<div>{name}{variant}</div></div>'
                f'</td>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:600;">{item.quantity}</td>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-family:monospace;">${item.unit_price}</td>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-family:monospace;font-weight:700;">${item.line_total}</td>'
                f'</tr>'
            )

        products_section = ''
        if product_rows:
            products_section = f'''
            <div style="margin-bottom:20px;">
              <h3 style="margin:0 0 10px;font-size:14px;color:#555;text-transform:uppercase;letter-spacing:0.05em;">Products Ordered</h3>
              <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background:#f5f5f5;">
                    <th style="padding:10px 14px;text-align:left;font-size:12px;color:#666;">Product</th>
                    <th style="padding:10px 14px;text-align:center;font-size:12px;color:#666;">Qty</th>
                    <th style="padding:10px 14px;text-align:right;font-size:12px;color:#666;">Unit Price</th>
                    <th style="padding:10px 14px;text-align:right;font-size:12px;color:#666;">Line Total</th>
                  </tr>
                </thead>
                <tbody>{product_rows}</tbody>
              </table>
            </div>
            '''

        # Gift boxes section
        boxes = obj.gift_boxes.prefetch_related('items__product').all()
        boxes_section = ''
        for box in boxes:
            box_item_rows = ''
            for bi in box.items.select_related('product').all():
                p_name = bi.product_name
                if bi.product_id:
                    try:
                        url = reverse('admin:products_product_change', args=[bi.product_id])
                        p_name = f'<a href="{url}" style="font-weight:600;color:#1a4035;">{bi.product_name}</a>'
                    except Exception:
                        pass
                sku = f'<span style="color:#aaa;font-size:11px;margin-left:6px;">({bi.product_sku})</span>' if bi.product_sku else ''
                box_item_rows += (
                    f'<tr>'
                    f'<td style="padding:8px 14px;border-bottom:1px solid #e8f5ee;">{p_name}{sku}</td>'
                    f'<td style="padding:8px 14px;border-bottom:1px solid #e8f5ee;text-align:center;font-weight:700;">x{bi.quantity}</td>'
                    f'</tr>'
                )
            if not box_item_rows:
                box_item_rows = '<tr><td colspan="2" style="padding:10px;color:#aaa;font-style:italic;">No products recorded.</td></tr>'

            boxes_section += f'''
            <div style="margin-bottom:16px;border:1.5px solid #4caf7d;border-radius:10px;overflow:hidden;">
              <div style="background:#1a4035;padding:12px 16px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">🎁</span>
                <strong style="color:white;font-size:14px;">{box.gift_box_name}</strong>
                <span style="margin-left:auto;background:#c5e84a;color:#1a4035;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;">${box.gift_box_price} flat fee</span>
              </div>
              <table style="width:100%;border-collapse:collapse;background:white;">
                <thead>
                  <tr style="background:#e8f5ee;">
                    <th style="padding:8px 14px;text-align:left;font-size:12px;color:#1a4035;font-weight:600;">Product inside this box</th>
                    <th style="padding:8px 14px;text-align:center;font-size:12px;color:#1a4035;font-weight:600;">Qty</th>
                  </tr>
                </thead>
                <tbody>{box_item_rows}</tbody>
              </table>
            </div>
            '''

        if not boxes_section:
            boxes_html = ''
        else:
            boxes_html = f'''
            <div style="margin-bottom:20px;">
              <h3 style="margin:0 0 10px;font-size:14px;color:#555;text-transform:uppercase;letter-spacing:0.05em;">Gift Boxes</h3>
              {boxes_section}
            </div>
            '''

        if not products_section and not boxes_html:
            return mark_safe('<p style="color:#999;font-style:italic;padding:12px;">No order items found.</p>')

        return mark_safe(f'''
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:900px;">
          {products_section}
          {boxes_html}
        </div>
        ''')
    full_order_summary.short_description = 'Full Order Contents'


# ── Standalone Gift Box Order admin ─────────────────────────────────────────

@admin.register(OrderGiftBox)
class OrderGiftBoxAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_link', 'customer_email', 'gift_box_name', 'gift_box_price', 'items_list', 'created_at')
    list_filter = ('created_at', 'gift_box_name')
    search_fields = ('order__order_number', 'gift_box_name', 'order__user__email', 'items__product_name')
    readonly_fields = ('order', 'gift_box_name', 'gift_box_price', 'created_at', 'box_contents_detail')
    inlines = [OrderGiftBoxItemInline]

    fieldsets = (
        ('Box Info', {'fields': ('order', 'gift_box_name', 'gift_box_price', 'created_at')}),
        ('Contents', {'fields': ('box_contents_detail',)}),
    )

    def order_link(self, obj):
        try:
            url = reverse('admin:orders_order_change', args=[obj.order.id])
            return mark_safe(f'<a href="{url}" style="font-weight:600;color:#1a2e1a;">{obj.order.order_number}</a>')
        except Exception:
            return obj.order.order_number
    order_link.short_description = 'Order'

    def customer_email(self, obj):
        return obj.order.user.email if obj.order.user else '—'
    customer_email.short_description = 'Customer'

    def items_list(self, obj):
        items = obj.items.all()
        if not items:
            return mark_safe('<span style="color:#aaa;font-style:italic;">Empty</span>')
        parts = [f'{i.quantity}x {i.product_name}' for i in items]
        return mark_safe(
            '<div style="font-size:12px;line-height:1.7;">' +
            '<br>'.join(f'<span style="background:#e8f5ee;border-radius:4px;padding:1px 7px;">{p}</span>' for p in parts) +
            '</div>'
        )
    items_list.short_description = 'Products in Box'

    def box_contents_detail(self, obj):
        items = obj.items.select_related('product').all()
        if not items:
            return mark_safe('<p style="color:#aaa;font-style:italic;">No products in this box.</p>')
        rows = ''
        for item in items:
            name = item.product_name
            if item.product_id:
                try:
                    url = reverse('admin:products_product_change', args=[item.product_id])
                    name = f'<a href="{url}" style="color:#1a4035;font-weight:600;">{item.product_name}</a>'
                except Exception:
                    pass
            rows += (
                f'<tr>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #e8f5ee;font-size:13px;">{name}</td>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #e8f5ee;text-align:center;font-weight:700;">{item.quantity}</td>'
                f'<td style="padding:10px 14px;border-bottom:1px solid #e8f5ee;font-family:monospace;color:#888;font-size:12px;">{item.product_sku or "—"}</td>'
                f'</tr>'
            )
        return mark_safe(f'''
        <table style="width:100%;border-collapse:collapse;border:1px solid #d0e8d8;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#e8f5ee;">
              <th style="padding:10px 14px;text-align:left;font-size:12px;color:#1a4035;">Product</th>
              <th style="padding:10px 14px;text-align:center;font-size:12px;color:#1a4035;">Qty</th>
              <th style="padding:10px 14px;text-align:left;font-size:12px;color:#1a4035;">SKU</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        ''')
    box_contents_detail.short_description = 'Detailed Box Contents'
