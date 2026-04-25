# Product Variants System

This e-commerce platform now supports product variants (sizes, colors, etc.) for flexible product catalog management.

## Overview

The variants system consists of four main models:

1. **ProductVariantType** - Defines what types of variants exist (e.g., "Color", "Size")
2. **ProductVariantValue** - Individual values for each variant type (e.g., "Red", "Blue" for Color; "S", "M", "L" for Size)
3. **ProductVariant** - Links a product to its applicable variant types
4. **ProductVariantSKU** - Individual combinations of variants with their own stock, pricing, and images

## How to Use

### Step 1: Create Variant Types (Admin Only)

Go to Django Admin (`/admin/`) → Product Variant Types and create your variant types.

**Example:**
- Name: `Color`, Slug: `color`
- Name: `Size`, Slug: `size`

### Step 2: Add Variant Values

For each variant type, add possible values via the Django Admin.

**Example for Color:**
- Value: `Red`, Color Hex: `#FF0000`
- Value: `Blue`, Color Hex: `#0000FF`
- Value: `Black`, Color Hex: `#000000`

**Example for Size:**
- Value: `S` (Small)
- Value: `M` (Medium)
- Value: `L` (Large)
- Value: `XL` (Extra Large)

### Step 3: Configure Product Variants

1. Go to Django Admin → Products and create/edit a product
2. Save the product first
3. Go to the product detail page and scroll to "Product Variant Config"
4. Click "Add Product Variant Config" and select which variant types apply to this product
5. For a shirt, you might select: Color and Size

### Step 4: Create Variant SKUs

For each combination of variants, create a ProductVariantSKU with its own stock and pricing.

**Example for a Red Size M shirt:**
- SKU: `SHIRT-RED-M`
- Variant Values: Red + Medium
- Stock: 50
- Price: $29.99 (optional - if blank, uses product base price)

You can also upload a specific image for this variant combination.

### Step 5: Display in Store UI

When customers browse the product, they'll see:
1. Color and Size selection dropdowns/buttons
2. Real-time stock availability per combination
3. Variant-specific pricing if configured
4. Variant-specific image if available

### Step 6: Cart & Checkout

When adding to cart, users select their variant:
```json
{
  "product_id": 1,
  "variant_sku_id": 5,
  "quantity": 2
}
```

The cart will display the variant description (e.g., "Color: Red, Size: M") and use the variant SKU's stock and pricing.

## API Endpoints

### Product Detail (includes variant info)
```
GET /api/products/{slug}/
```

Response includes:
- `variant_config`: What variant types this product has
- `variant_skus`: All available combinations with their stock/price

### Add to Cart with Variant
```
POST /api/cart/add/
{
  "product_id": 1,
  "variant_sku_id": 5,
  "quantity": 2
}
```

For products without variants, omit `variant_sku_id`.

### Update Cart Item
```
PATCH /api/cart/items/{item_id}/
{
  "quantity": 3
}
```

### Get Cart
```
GET /api/cart/
```

Response shows each cart item with:
- `variant_sku`: Full variant details including color, size, etc.
- `variant_display`: Human-readable description (e.g., "Color: Red, Size: M, Material: Cotton")
- `unit_price`: Price from variant or product
- `line_total`: Quantity × unit_price

## Database Schema

```
Product
├── ProductVariant (1-to-1)
│   ├── variant_types (M-to-M → ProductVariantType)
│   │   └── values (1-to-M → ProductVariantValue)
│   └── ProductVariantSKU (1-to-M)
│       └── variant_values (M-to-M → ProductVariantValue)
└── CartItem (M-to-1, optional variant_sku FK)
    └── variant_sku (FK → ProductVariantSKU)
```

## Stock Management

- **Base Product Stock**: Used for products without variants
- **Variant SKU Stock**: Used for specific variants
- **Checkout Validation**: Checks stock against variant if selected, otherwise product stock
- **Stock Reduction**: Reduces variant SKU stock or product stock accordingly

## Pricing

- **Base Product Price**: Default price for all variants (if no override)
- **Variant SKU Price**: Optional override per variant combination
- **API Response**: Always includes both base price and variant price

## Frontend Integration

### Product Detail Page

```tsx
// Get variant config on page load
const product = await fetch(`/api/products/${slug}/`).then(r => r.json());

// Show variant selectors
product.variant_config.variant_types.forEach(type => {
  // Render dropdown/buttons for each type
});

// Filter available combinations
const availableCombinations = product.variant_skus.filter(sku => 
  sku.is_active && sku.stock > 0 && matchesSelection(sku)
);

// Get stock for selected combination
const selectedSKU = product.variant_skus.find(sku => /* matches selection */);
const availableStock = selectedSKU ? selectedSKU.stock : product.stock;
```

### Add to Cart

```tsx
const response = await fetch('/api/cart/add/', {
  method: 'POST',
  body: JSON.stringify({
    product_id: product.id,
    variant_sku_id: selectedVariantSKU?.id,  // Include if variants exist
    quantity: qty
  })
});
```

### Cart Display

```tsx
{cart.items.map(item => (
  <div>
    {item.product.name}
    {item.variant_display && <small>{item.variant_display}</small>}
    Price: {item.unit_price} × {item.quantity} = {item.line_total}
  </div>
))}
```

## Best Practices

1. **Always use unique SKUs** - Helps with inventory tracking and fulfillment
2. **Set low stock threshold** - Alert when variant stock gets low
3. **Use color hex codes** - Enables visual color swatches in UI
4. **Upload variant images** - When different colors look significantly different
5. **Test stock reduction** - Verify stock updates correctly after checkout
6. **Monitor variant limits** - Too many variants slow down queries

## Example Scenarios

### Clothing Store
- **Variant Types**: Color, Size
- **Products**: T-Shirt, Jeans, Dress
- **Example SKUs**: 
  - `TSHIRT-RED-M`: Red, Medium, 50 units, $19.99
  - `JEANS-BLUE-32`: Blue, Size 32, 30 units, $59.99

### Electronics Store
- **Variant Types**: Color, Storage
- **Products**: Smartphone
- **Example SKUs**:
  - `PHONE-BLACK-128GB`: Black, 128GB, 20 units, $799.99
  - `PHONE-WHITE-256GB`: White, 256GB, 15 units, $899.99

### Home Goods Store
- **Variant Types**: Color, Material
- **Products**: Pillow
- **Example SKUs**:
  - `PILLOW-RED-COTTON`: Red, Cotton, 100 units, $29.99
  - `PILLOW-RED-POLYESTER`: Red, Polyester, 80 units, $24.99
