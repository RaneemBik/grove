from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()


class Category(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    sku = models.CharField(max_length=100, unique=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False, help_text='Show this product in the New Arrivals section')
    subscribers_only = models.BooleanField(default=False)
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return self.name

    @property
    def is_in_stock(self):
        return self.stock > 0

    @property
    def is_low_stock(self):
        return 0 < self.stock <= self.low_stock_threshold

    @property
    def discount_percentage(self):
        if self.compare_price and self.compare_price > self.price:
            return round((1 - self.price / self.compare_price) * 100)
        return 0

    @property
    def average_rating(self):
        reviews = self.reviews.filter(is_approved=True)
        if reviews.exists():
            return round(reviews.aggregate(models.Avg('rating'))['rating__avg'], 1)
        return 0

    @property
    def review_count(self):
        return self.reviews.filter(is_approved=True).count()

    def reduce_stock(self, quantity):
        if self.stock < quantity:
            raise ValueError(f"Insufficient stock. Available: {self.stock}")
        self.stock -= quantity
        self.save(update_fields=['stock'])

    def restore_stock(self, quantity):
        self.stock += quantity
        self.save(update_fields=['stock'])


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.product.name} - Image {self.id}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('product', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.product.name} ({self.rating}/5)"


class Banner(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=400, blank=True)
    image = models.ImageField(upload_to='banners/')
    link = models.URLField(blank=True)
    link_text = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'product')
        verbose_name = 'Wishlist Item'
        verbose_name_plural = 'Wishlist Items'

    def __str__(self):
        return f"{self.user.email} -> {self.product.name}"


class ProductVariantType(models.Model):
    """Variant types like 'Color', 'Size', etc. - global across all products"""
    name = models.CharField(max_length=100, unique=True)  # e.g., "Color", "Size"
    slug = models.SlugField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100, blank=True)  # e.g., "Choose Color"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Product Variant Type'
        verbose_name_plural = 'Product Variant Types'

    def __str__(self):
        return self.name


class ProductVariantValue(models.Model):
    """Individual values for variant types - e.g., 'Red', 'Blue' for Color type"""
    variant_type = models.ForeignKey(ProductVariantType, on_delete=models.CASCADE, related_name='values')
    value = models.CharField(max_length=100)  # e.g., "Red", "M", "XL"
    color_hex = models.CharField(max_length=7, blank=True, null=True)  # For color swatches: "#FF0000"
    image = models.ImageField(upload_to='variant_values/', blank=True, null=True)  # For visual variants
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'value']
        unique_together = ('variant_type', 'value')
        verbose_name = 'Product Variant Value'
        verbose_name_plural = 'Product Variant Values'

    def __str__(self):
        return f"{self.variant_type.name}: {self.value}"


class ProductVariant(models.Model):
    """Links a Product to its applicable VariantTypes - e.g., 'Shirt' has Color and Size"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='variant_config')
    variant_types = models.ManyToManyField(ProductVariantType, related_name='products')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Product Variant Config'
        verbose_name_plural = 'Product Variant Configs'

    def __str__(self):
        return f"{self.product.name} Variants"


class ProductVariantSKU(models.Model):
    """Individual SKU/combination of variants - e.g., Red + Size M shirt with its own stock/price/images"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variant_skus')
    sku = models.CharField(max_length=100, unique=True)
    variant_values = models.ManyToManyField(ProductVariantValue, related_name='skus')
    
    # Optional overrides per SKU
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])  # If different from base product
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    short_description = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    size_length_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    size_width_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    
    # Optional visual override
    image = models.ImageField(upload_to='product_variants/', blank=True, null=True)  # Specific image for this variant
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sku']
        verbose_name = 'Product Variant SKU'
        verbose_name_plural = 'Product Variant SKUs'

    def __str__(self):
        values = " + ".join([str(v) for v in self.variant_values.all()])
        return f"{self.product.name} ({values})"

    @property
    def effective_price(self):
        """Return SKU-specific price or fall back to base product price"""
        return self.price if self.price is not None else self.product.price

    @property
    def effective_short_description(self):
        return self.short_description or self.product.short_description

    @property
    def effective_description(self):
        return self.description or self.product.description

    @property
    def is_in_stock(self):
        return self.stock > 0

    @property
    def is_low_stock(self):
        return 0 < self.stock <= self.low_stock_threshold

    def reduce_stock(self, quantity):
        if self.stock < quantity:
            raise ValueError(f"Insufficient stock for {self}. Available: {self.stock}")
        self.stock -= quantity
        self.save(update_fields=['stock'])

    def restore_stock(self, quantity):
        self.stock += quantity
        self.save(update_fields=['stock'])


class SeasonalKit(models.Model):
    """A curated seasonal kit (e.g. Summer Glow Kit) — admin-managed."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='seasonal_kits/', blank=True, null=True)
    badge = models.CharField(max_length=80, blank=True, help_text='Short badge label shown on card, e.g. "Summer Edition"')
    is_active = models.BooleanField(default=True, help_text='Show this kit on the website')
    order = models.PositiveIntegerField(default=0, help_text='Display order (lower = first)')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Seasonal Kit'
        verbose_name_plural = 'Seasonal Kits'

    def __str__(self):
        return self.name

    @property
    def item_count(self):
        return self.items.count()


class SeasonalKitItem(models.Model):
    """A product inside a SeasonalKit."""
    kit = models.ForeignKey(SeasonalKit, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='seasonal_kit_items')
    note = models.CharField(max_length=200, blank=True, help_text='Optional display note, e.g. "SPF 50+"')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']
        unique_together = ('kit', 'product')
        verbose_name = 'Kit Item'
        verbose_name_plural = 'Kit Items'

    def __str__(self):
        return f'{self.kit.name} — {self.product.name}'
