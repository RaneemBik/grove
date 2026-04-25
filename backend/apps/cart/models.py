from django.db import models
from django.contrib.auth import get_user_model
from apps.products.models import Product

User = get_user_model()


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'

    def __str__(self):
        return f"Cart of {self.user.email}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items.all())

    def clear(self):
        self.items.all().delete()


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    variant_sku = models.ForeignKey('products.ProductVariantSKU', on_delete=models.CASCADE, related_name='cart_items', null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Unique combination of cart, product, and optional variant_sku
        # If no variant_sku, it's a base product. If variant_sku, it's a specific variant
        ordering = ['-added_at']

    def __str__(self):
        if self.variant_sku:
            return f"{self.quantity} x {self.product.name} ({self.variant_sku})"
        return f"{self.quantity} x {self.product.name}"

    @property
    def unit_price(self):
        """Return variant SKU price or fall back to product price"""
        if self.variant_sku:
            return self.variant_sku.effective_price
        return self.product.price

    @property
    def line_total(self):
        return self.unit_price * self.quantity



class KitCartOrder(models.Model):
    """Records that a user added an entire seasonal kit to their cart."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kit_cart_orders')
    kit_slug = models.CharField(max_length=200)
    kit_name = models.CharField(max_length=200)
    added_at = models.DateTimeField(auto_now_add=True)
    # Snapshot of product ids that were added
    product_names = models.TextField(help_text='Comma-separated list of product names added from the kit')

    class Meta:
        ordering = ['-added_at']
        verbose_name = 'Kit Cart Order'
        verbose_name_plural = 'Kit Cart Orders'

    def __str__(self):
        return f"{self.user.email} added kit '{self.kit_name}' — {self.added_at.strftime('%Y-%m-%d %H:%M')}"
