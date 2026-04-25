from django.db import models
from django.conf import settings
from apps.products.models import Product

User = settings.AUTH_USER_MODEL


class GiftBox(models.Model):
    """A customizable gift box that admin configures with a price and image."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)
    image = models.ImageField(upload_to='gift_boxes/', blank=True, null=True)
    max_items = models.PositiveIntegerField(default=10, help_text='Maximum number of products allowed in this box')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['price']
        verbose_name = 'Gift Box'
        verbose_name_plural = 'Gift Boxes'

    def __str__(self):
        return f"{self.name} (${self.price})"


class GiftBoxOrder(models.Model):
    """A user's gift box configuration — products they've added to a specific box."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gift_box_orders', null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, null=True)
    gift_box = models.ForeignKey(GiftBox, on_delete=models.CASCADE, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    checked_out = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Gift Box Order'
        verbose_name_plural = 'Gift Box Orders'

    def __str__(self):
        return f"GiftBox #{self.id} — {self.gift_box.name}"

    @property
    def total_price(self):
        return self.gift_box.price


class GiftBoxItem(models.Model):
    """A product inside a GiftBoxOrder."""
    gift_box_order = models.ForeignKey(GiftBoxOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('gift_box_order', 'product')
        verbose_name = 'Gift Box Item'
        verbose_name_plural = 'Gift Box Items'

    def __str__(self):
        return f"{self.product.name} × {self.quantity}"
