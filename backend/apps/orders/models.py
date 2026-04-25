from django.db import models
from django.contrib.auth import get_user_model
from apps.products.models import Product

User = get_user_model()


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Credit Card'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('cash_on_delivery', 'Cash on Delivery'),
        ('mock', 'Mock Payment'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, default='mock')
    payment_id = models.CharField(max_length=255, blank=True)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)

    # Snapshot shipping address
    shipping_full_name = models.CharField(max_length=100)
    shipping_phone = models.CharField(max_length=20)
    shipping_street = models.CharField(max_length=255)
    shipping_apartment = models.CharField(max_length=100, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100)

    # Pricing snapshot (never recalculate from products)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    gift_box_total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order_number} - {self.user.email if self.user else 'Deleted User'}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self._generate_order_number()
        super().save(*args, **kwargs)

    def _generate_order_number(self):
        import uuid
        return 'ORD-' + str(uuid.uuid4()).upper()[:12]

    @property
    def shipping_address_display(self):
        parts = [self.shipping_full_name, self.shipping_street]
        if self.shipping_apartment:
            parts.append(self.shipping_apartment)
        parts += [self.shipping_city, self.shipping_state, self.shipping_postal_code, self.shipping_country]
        return ', '.join(parts)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='order_items')
    variant_sku = models.ForeignKey('products.ProductVariantSKU', on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    
    # Snapshot product data
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100, blank=True)
    product_image = models.CharField(max_length=500, blank=True)
    
    # Snapshot variant data (human-readable, e.g., "Color: Red, Size: M")
    variant_description = models.CharField(max_length=500, blank=True)
    
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['id']

    def __str__(self):
        if self.variant_description:
            return f"{self.quantity} x {self.product_name} ({self.variant_description})"
        return f"{self.quantity} x {self.product_name}"

    def save(self, *args, **kwargs):
        self.line_total = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class OrderGiftBox(models.Model):
    """Tracks which gift box (and its products) was ordered as part of an Order."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='gift_boxes')
    gift_box_name = models.CharField(max_length=200)
    gift_box_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Order Gift Box'
        verbose_name_plural = 'Order Gift Boxes'

    def __str__(self):
        return f"{self.gift_box_name} (${self.gift_box_price}) — Order #{self.order.order_number}"


class OrderGiftBoxItem(models.Model):
    """A product inside an OrderGiftBox snapshot."""
    order_gift_box = models.ForeignKey(OrderGiftBox, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='gift_box_order_items')
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['id']
        verbose_name = 'Order Gift Box Item'
        verbose_name_plural = 'Order Gift Box Items'

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"
