import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Plus, Minus, ChevronRight, ChevronLeft, Truck, RotateCcw, Shield, Star } from 'lucide-react';
import { productApi } from '../api';
import { useCart } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import { fmt, imgUrl, fmtDate } from '../utils';
import { Spinner, Button, Stars } from '../components/ui';
import { showAddedToCartToast } from '../utils/cartToast';
import type { Product } from '../types';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();

  const variantTypes = React.useMemo(() => {
    if (!product) return [] as Array<{ name: string; display_name?: string; values: Array<{ id: number; value: string; color_hex?: string | null }> }>;

    if (product.variant_config?.variant_types?.length) {
      return product.variant_config.variant_types.map((vt) => ({
        name: vt.name,
        display_name: vt.display_name,
        values: vt.values,
      }));
    }

    const map: Record<string, { name: string; display_name: string; values: Array<{ id: number; value: string; color_hex?: string | null }> }> = {};
    (product.variant_skus || []).forEach((sku) => {
      if (!sku.is_active) return;
      sku.variant_values.forEach((vv) => {
        if (!map[vv.type_name]) {
          map[vv.type_name] = { name: vv.type_name, display_name: vv.type_name, values: [] };
        }
        if (!map[vv.type_name].values.some((v) => v.value === vv.value)) {
          map[vv.type_name].values.push({ id: vv.id, value: vv.value, color_hex: vv.color_hex });
        }
      });
    });
    return Object.values(map);
  }, [product]);

  const applyVariantSelection = (typeName: string, value: string) => {
    if (!product?.variant_skus?.length) {
      setSelectedValues((prev) => ({ ...prev, [typeName]: value }));
      return;
    }

    const baseSelection = { ...selectedValues, [typeName]: value };

    const exact = product.variant_skus.find((sku) => {
      if (!sku.is_active) return false;
      return variantTypes.every((vt) => {
        const selected = baseSelection[vt.name];
        if (!selected) return true;
        return sku.variant_values.some((vv) => vv.type_name === vt.name && vv.value === selected);
      });
    });

    if (exact) {
      setSelectedValues(baseSelection);
      return;
    }

    const compatible = product.variant_skus.find((sku) => (
      sku.is_active && sku.variant_values.some((vv) => vv.type_name === typeName && vv.value === value)
    ));

    if (!compatible) {
      setSelectedValues(baseSelection);
      return;
    }

    const nextSelection = { ...baseSelection };
    variantTypes.forEach((vt) => {
      const vv = compatible.variant_values.find((item) => item.type_name === vt.name);
      if (vv) nextSelection[vt.name] = vv.value;
    });
    setSelectedValues(nextSelection);
  };

  useEffect(() => {
    setLoading(true);
    productApi.detail(slug!).then(r => setProduct(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!variantTypes.length) {
      setSelectedValues({});
      return;
    }
    const defaults: Record<string, string> = {};
    const firstSku = product?.variant_skus?.find((sku) => sku.is_active);
    variantTypes.forEach((vt) => {
      const skuValue = firstSku?.variant_values.find((vv) => vv.type_name === vt.name)?.value;
      if (skuValue) {
        defaults[vt.name] = skuValue;
      } else if (vt.values?.length) {
        defaults[vt.name] = vt.values[0].value;
      }
    });
    setSelectedValues(defaults);
  }, [product, variantTypes]);

  const selectedVariant = product?.variant_skus?.find((sku) => {
    if (!variantTypes.length) return false;
    return variantTypes.every((vt) => {
      const selected = selectedValues[vt.name];
      return sku.variant_values.some((vv) => vv.type_name === vt.name && vv.value === selected);
    });
  }) || null;

  const variantGalleryImages = product?.variant_skus?.filter((sku) => sku.is_active && !!sku.image).map((sku) => ({
    id: `variant-${sku.id}`,
    image: sku.image as string,
    alt_text: sku.sku,
    is_primary: false,
    order: 1000,
  })) || [];

  const selectedVariantImage = selectedVariant?.image
    ? [{ id: `selected-${selectedVariant.id}`, image: selectedVariant.image, alt_text: selectedVariant.sku, is_primary: true, order: -1 }]
    : [];

  const galleryMap = new Map<string, { id: string; image: string; alt_text: string }>();
  [...selectedVariantImage, ...(product?.images || []), ...variantGalleryImages].forEach((img: any) => {
    if (img?.image && !galleryMap.has(img.image)) {
      galleryMap.set(img.image, { id: String(img.id), image: img.image, alt_text: img.alt_text || product?.name || 'Product image' });
    }
  });
  const galleryImages = Array.from(galleryMap.values());

  useEffect(() => {
    if (!selectedVariant) return;
    const preferredImages = [
      selectedVariant.image,
      ...selectedVariant.variant_values.map((vv) => vv.image),
    ].filter(Boolean) as string[];

    if (!preferredImages.length) {
      setActiveImg(0);
      return;
    }

    const idx = galleryImages.findIndex((img) => preferredImages.includes(img.image));
    setActiveImg(idx >= 0 ? idx : 0);
  }, [selectedVariant?.id, galleryImages]);

  const goToPrevImage = () => {
    setActiveImg((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const goToNextImage = () => {
    setActiveImg((prev) => (prev + 1) % galleryImages.length);
  };

  const displayPrice = selectedVariant?.price || product?.price;
  const displayComparePrice = selectedVariant?.compare_price || product?.compare_price;
  const displayShortDescription = selectedVariant?.effective_short_description || product?.short_description;
  const displayDescription = selectedVariant?.effective_description || product?.description;
  const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);
  const isInStock = selectedVariant ? selectedVariant.is_in_stock : !!product?.is_in_stock;
  const isLowStock = selectedVariant ? selectedVariant.is_low_stock : !!product?.is_low_stock;

  const handleAdd = async () => {
    if (!isAuthenticated) { nav('/auth/login'); return; }
    if ((product?.variant_skus?.length || 0) > 0 && !selectedVariant) {
      toast.error('Please select a valid variant combination.');
      return;
    }
    setAdding(true);
    try { await add(product!.id, qty, selectedVariant?.id); showAddedToCartToast(product!.name); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not add'); }
    finally { setAdding(false); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { nav('/auth/login'); return; }
    if (!product || wishLoading) return;
    setWishLoading(true);
    try {
      const { data } = await productApi.toggleWishlist(product.id);
      setProduct((prev) => prev ? { ...prev, is_wishlisted: !!data?.wishlisted } : prev);
      toast.success(data?.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not update wishlist');
    } finally {
      setWishLoading(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Spinner size={44} /></div>;
  if (!product) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Product not found.</p>
      <Link to="/products" className="btn btn-primary">Back to Shop</Link>
    </div>
  );

  const images = galleryImages;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[['Home','/'], ['Shop','/products'], product.category ? [product.category.name,`/products?category=${product.category.slug}`] : null, [product.name,'']].filter(Boolean).map((item, i, arr) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
              {i < arr.length - 1
                ? <Link to={item![1]} style={{ fontSize: 13, color: 'var(--text-muted)', transition: 'color 0.2s' }}>{item![0]}</Link>
                : <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{item![0]}</span>
              }
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '48px 24px 80px' }}>
        <div className="pd-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 56, alignItems: 'start' }}>
          {/* Images */}
          <div className="pd-gallery-col" style={{ position: 'sticky', top: 90 }}>
            {/* Main image with arrow navigation */}
            <div style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: '1', background: 'var(--green-mist)', marginBottom: 12, position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
              <img
                src={imgUrl(images[activeImg]?.image || product.primary_image)}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
                onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
              {product.discount_percentage > 0 && (
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                  <span className="chip chip-lime" style={{ fontSize: 13, fontWeight: 700 }}>−{product.discount_percentage}%</span>
                </div>
              )}

              {/* Image counter badge */}
              {images.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                  borderRadius: 100, padding: '4px 12px',
                  fontSize: 12, fontFamily: 'var(--font-mono)', color: 'white', letterSpacing: '0.05em',
                }}>
                  {activeImg + 1} / {images.length}
                </div>
              )}

              {/* Left arrow */}
              {images.length > 1 && (
                <button
                  onClick={goToPrevImage}
                  aria-label="Previous image"
                  style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.92)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s', color: 'var(--green)',
                    zIndex: 2,
                  }}
                  className="gallery-arrow"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
              )}

              {/* Right arrow */}
              {images.length > 1 && (
                <button
                  onClick={goToNextImage}
                  aria-label="Next image"
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.92)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s', color: 'var(--green)',
                    zIndex: 2,
                  }}
                  className="gallery-arrow"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImg(i)} style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: `2.5px solid ${i === activeImg ? 'var(--green-light)' : 'var(--border)'}`, background: 'var(--green-mist)', padding: 0, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                    <img src={imgUrl(img.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {product.category && <Link to={`/products?category=${product.category.slug}`}><span className="chip chip-green">{product.category.name}</span></Link>}
                {product.subscribers_only && <span className="chip chip-lime">Members only</span>}
              </div>
              {product.sku && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>SKU: {product.sku}</span>}
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, color: 'var(--green)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>{product.name}</h1>

            {product.review_count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Stars rating={product.average_rating} />
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{product.average_rating} ({product.review_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 700, color: 'var(--green)' }}>{fmt(displayPrice)}</span>
              {displayComparePrice && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{fmt(displayComparePrice)}</span>}
              {product.discount_percentage > 0 && <span className="chip chip-lime">Save {product.discount_percentage}%</span>}
            </div>

            {displayShortDescription && <p style={{ color: 'var(--text-mid)', lineHeight: 1.75, marginBottom: 24, fontSize: 15 }}>{displayShortDescription}</p>}

            {variantTypes.length ? (
              <div style={{ marginBottom: 20, display: 'grid', gap: 12 }}>
                {variantTypes.map((vt) => {
                  const isColorType = vt.name.toLowerCase().includes('color') || vt.display_name?.toLowerCase().includes('color');
                  if (isColorType) {
                    return (
                      <div key={vt.name} style={{ display: 'grid', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-mid)' }}>{vt.display_name || vt.name}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {vt.values.map((val) => {
                            const selected = selectedValues[vt.name] === val.value;
                            const swatchColor = val.color_hex || '#c7b1b1';
                            return (
                              <button
                                key={val.id}
                                type="button"
                                onClick={() => applyVariantSelection(vt.name, val.value)}
                                title={val.value}
                                style={{
                                  border: selected ? '2px solid var(--green)' : '1px solid var(--border)',
                                  borderRadius: 999,
                                  padding: '5px 10px 5px 5px',
                                  background: 'white',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  cursor: 'pointer',
                                  color: 'var(--text)',
                                  fontSize: 13,
                                  fontWeight: selected ? 700 : 500,
                                }}
                              >
                                <span style={{ width: 18, height: 18, borderRadius: '50%', background: swatchColor, border: '1px solid rgba(0,0,0,0.12)', display: 'inline-block' }} />
                                {val.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <label key={vt.name} style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-mid)' }}>{vt.display_name || vt.name}</span>
                      <select
                        value={selectedValues[vt.name] || ''}
                        onChange={(e) => applyVariantSelection(vt.name, e.target.value)}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: '10px 12px',
                          background: 'white',
                          color: 'var(--text)',
                          fontSize: 14,
                        }}
                      >
                        {vt.values.map((val) => (
                          <option key={val.id} value={val.value}>{val.value}</option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {selectedVariant && (selectedVariant.size_length_cm || selectedVariant.size_width_cm) && (
              <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 12, background: 'var(--green-mist)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>Selected Variant Size Details</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-mid)' }}>
                  {selectedVariant.size_length_cm ? `Length: ${selectedVariant.size_length_cm} cm` : ''}
                  {selectedVariant.size_length_cm && selectedVariant.size_width_cm ? ' | ' : ''}
                  {selectedVariant.size_width_cm ? `Width: ${selectedVariant.size_width_cm} cm` : ''}
                </p>
              </div>
            )}

            {/* Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: isInStock ? '#4ade80' : '#f87171' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: isInStock ? '#16a34a' : '#dc2626' }}>
                {isInStock ? (isLowStock ? `Only ${effectiveStock} left!` : 'In Stock') : 'Out of Stock'}
              </span>
            </div>

            {isInStock && (
              <div className="pd-action-row" style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Qty */}
                <div className="pd-qty-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--border)', borderRadius: 100, padding: '8px 16px' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="btn-icon" style={{ width: 28, height: 28, padding: 0 }}><Minus size={14} /></button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(effectiveStock, q + 1))} className="btn-icon" style={{ width: 28, height: 28, padding: 0 }}><Plus size={14} /></button>
                </div>
                <Button className="pd-add-btn" onClick={handleAdd} loading={adding} style={{ flex: 1, minWidth: 0, borderRadius: 100, gap: 8, padding: '14px 28px', background: 'var(--green)', color: 'white', fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  <ShoppingBag size={17} /> Add to Cart
                </Button>
                <button onClick={handleWishlist} disabled={wishLoading} className="btn-icon" style={{ width: 50, height: 50, border: '1.5px solid var(--border)', borderRadius: '50%', flexShrink: 0 }}>
                  <Heart size={18} fill={product.is_wishlisted ? 'var(--green-light)' : 'none'} style={{ color: product.is_wishlisted ? 'var(--green-light)' : 'currentColor' }} />
                </button>
              </div>
            )}

            {/* Guarantees */}
            <div className="pd-guarantees" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '20px 16px', background: 'var(--green-mist)', borderRadius: 16, marginBottom: 28 }}>
              {[{ Icon: Truck, t: 'Free $100+' }, { Icon: RotateCcw, t: '30-day returns' }, { Icon: Shield, t: 'Secure pay' }].map(({ Icon, t }) => (
                <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                  <Icon size={16} style={{ color: 'var(--green-light)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.3 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--green)' }}>Description</h3>
              <p style={{ color: 'var(--text-mid)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{displayDescription}</p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {product.reviews.length > 0 && (
          <div style={{ marginTop: 64, paddingTop: 48, borderTop: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--green)', marginBottom: 32 }}>Customer Reviews</h2>
            <div className="pd-reviews" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(280px,100%),1fr))', gap: 20 }}>
              {product.reviews.map(rev => (
                <div key={rev.id} style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{rev.user_name}</p>
                      <Stars rating={rev.rating} size={13} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(rev.created_at)}</span>
                  </div>
                  {rev.title && <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--text)' }}>{rev.title}</p>}
                  <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.65 }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .gallery-arrow:hover {
          background: rgba(255,255,255,1) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
          transform: translateY(-50%) scale(1.08) !important;
        }
        @media(max-width:900px){
          .pd-gallery-col{position:static!important;}
        }
        @media(max-width:700px){
          .pd-action-row{align-items:stretch!important;}
          .pd-qty-wrap{width:100%;justify-content:center;}
          .pd-add-btn{width:100%;justify-content:center;}
          .pd-guarantees{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
