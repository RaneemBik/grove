export interface User { id:number; username:string; email:string; first_name:string; last_name:string; full_name:string; phone:string; avatar:string|null; is_staff:boolean; is_subscriber:boolean; subscription_plan:'none'|'monthly'|'yearly'; subscription_started_at:string|null; subscription_expires_at:string|null; loyalty_points:number; date_joined:string; }
export interface Address { id:number; address_type:'home'|'work'|'other'; full_name:string; phone:string; street_address:string; apartment?:string; city:string; state:string; postal_code:string; country:string; is_default:boolean; }
export interface Category { id:number; name:string; slug:string; description:string; image:string|null; product_count:number; children:Category[]; }
export interface ProductImage { id:number; image:string; alt_text:string; is_primary:boolean; order:number; }
export interface Review { id:number; user:number; user_name:string; rating:number; title:string; comment:string; created_at:string; }
export interface ProductVariantValue { id:number; type_name:string; value:string; color_hex:string|null; image:string|null; }
export interface ProductVariantTypeValue { id:number; value:string; color_hex:string|null; image:string|null; order:number; }
export interface ProductVariantType { id:number; name:string; slug:string; display_name:string; values:ProductVariantTypeValue[]; is_active:boolean; }
export interface ProductVariantConfig { id:number; variant_types:ProductVariantType[]; is_active:boolean; }
export interface ProductVariantSKU {
	id:number;
	sku:string;
	variant_values:ProductVariantValue[];
	price:string|null;
	compare_price:string|null;
	short_description:string;
	description:string;
	effective_short_description:string;
	effective_description:string;
	size_length_cm:string|null;
	size_width_cm:string|null;
	stock:number;
	is_in_stock:boolean;
	is_low_stock:boolean;
	image:string|null;
	is_active:boolean;
	created_at:string;
}
export interface Product { id:number; name:string; slug:string; category:Category; description:string; short_description:string; price:string; compare_price:string|null; discount_percentage:number; sku:string; stock:number; is_in_stock:boolean; is_low_stock:boolean; is_featured:boolean; subscribers_only:boolean; is_wishlisted:boolean; primary_image:string|null; images:ProductImage[]; reviews:Review[]; average_rating:number; review_count:number; variant_config?:ProductVariantConfig|null; variant_skus?:ProductVariantSKU[]; created_at:string; }
export interface CartItem { id:number; product:Product; variant_sku?:ProductVariantSKU|null; variant_display?:string|null; quantity:number; unit_price:string; line_total:string; }
export interface Cart { id:number; items:CartItem[]; total_items:number; subtotal:string; }
export interface OrderItem { id:number; product:number|null; product_name:string; product_sku:string; product_image:string; unit_price:string; quantity:number; line_total:string; }
export interface Order { id:number; order_number:string; status:'pending'|'paid'|'processing'|'shipped'|'delivered'|'cancelled'|'refunded'; payment_method:string; is_paid:boolean; paid_at:string|null; shipping_full_name:string; shipping_phone:string; shipping_street:string; shipping_apartment:string; shipping_city:string; shipping_state:string; shipping_postal_code:string; shipping_country:string; subtotal:string; shipping_cost:string; tax:string; discount:string; total:string; notes:string; items:OrderItem[]; created_at:string; }
export interface PaginatedResponse<T> { count:number; next:string|null; previous:string|null; results:T[]; }
export interface Banner { id:number; title:string; subtitle:string; image:string; link:string; link_text:string; }
export interface ProductFilters { search?:string; category?:string; min_price?:string; max_price?:string; in_stock?:boolean; is_featured?:boolean; ordering?:string; page?:number; }

export interface GiftBox {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  image_url: string | null;
  max_items: number;
  is_active: boolean;
}

export interface GiftBoxItem {
  id: number;
  product: Product;
  product_id: number;
  quantity: number;
}

export interface GiftBoxOrder {
  id: number;
  gift_box: GiftBox;
  items: GiftBoxItem[];
  total_price: string;
  checked_out: boolean;
  created_at: string;
}

export interface SeasonalKitItem {
  id: number;
  product: Product;
  note: string;
  order: number;
}

export interface SeasonalKit {
  id: number;
  name: string;
  slug: string;
  description: string;
  badge: string;
  image_url: string | null;
  item_count: number;
  items: SeasonalKitItem[];
  order: number;
  is_active: boolean;
}
