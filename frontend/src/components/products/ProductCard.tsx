import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { useCart } from '../../store/cartStore';
import { useAuth } from '../../store/authStore';
import { productApi } from '../../api';
import { fmt, imgUrl } from '../../utils';
import { showAddedToCartToast } from '../../utils/cartToast';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(!!product.is_wishlisted);
  const [wishLoading, setWishLoading] = useState(false);
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { nav('/auth/login'); return; }
    setAdding(true);
    try {
      await add(product.id, 1);
      showAddedToCartToast(product.name);
    }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Could not add to cart'); }
    finally { setAdding(false); }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { nav('/auth/login'); return; }
    if (wishLoading) return;
    setWishLoading(true);
    try {
      const { data } = await productApi.toggleWishlist(product.id);
      setWishlisted(!!data?.wishlisted);
      toast.success(data?.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not update wishlist');
    } finally {
      setWishLoading(false);
    }
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="product-card animate-fade-up"
      style={{
        display: 'block', background: 'white', borderRadius: 20,
        overflow: 'hidden', border: '1px solid var(--border)',
        animationDelay: `${index * 0.06}s`,
        textDecoration: 'none', position: 'relative',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--green-mist)', overflow: 'hidden' }}>
        <img
          src={imgUrl(product.primary_image)}
          alt={product.name}
          className="product-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />

        {/* Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {product.discount_percentage > 0 && (
            <span className="chip chip-lime" style={{ fontSize: 11, fontWeight: 700 }}>−{product.discount_percentage}%</span>
          )}
          {!product.is_in_stock && <span className="chip chip-gray" style={{ fontSize: 11 }}>Sold out</span>}
          {product.is_low_stock && product.is_in_stock && <span className="chip chip-amber" style={{ fontSize: 11 }}>Low stock</span>}
          {product.is_featured && <span className="chip chip-green" style={{ fontSize: 11 }}>Featured</span>}
          {product.subscribers_only && <span className="chip chip-lime" style={{ fontSize: 11 }}>Members</span>}
        </div>

        {/* Hover actions */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center', padding: 12, gap: 8,
          background: 'linear-gradient(to top, rgba(26,46,26,0.5), transparent)',
          opacity: 0, transition: 'opacity 0.3s',
        }} className="card-overlay">
          <button
            onClick={handleAdd}
            disabled={adding || !product.is_in_stock}
            className="btn btn-lime btn-sm"
            style={{ borderRadius: 100, flex: 1, maxWidth: 200 }}
          >
            <ShoppingBag size={13} />
            {adding ? 'Adding…' : product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          <button
            onClick={handleWishlist}
            className="btn-icon"
            style={{ background: 'white', borderRadius: '50%', width: 36, height: 36, flexShrink: 0 }}
          >
            <Heart size={14} fill={wishlisted ? 'var(--green-light)' : 'none'} style={{ color: wishlisted ? 'var(--green-light)' : 'var(--text)' }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px 20px' }}>
        {product.category && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            {product.category.name}
          </p>
        )}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </h3>

        {product.review_count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={11} fill={i <= Math.round(product.average_rating) ? '#c5e84a' : 'var(--sand)'} stroke={i <= Math.round(product.average_rating) ? '#a8cc2e' : 'var(--sand)'} />
              ))}
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>({product.review_count})</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{fmt(product.price)}</span>
          {product.compare_price && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{fmt(product.compare_price)}</span>
          )}
        </div>
      </div>

      <style>{`.product-card:hover .card-overlay { opacity: 1 !important; }`}</style>
    </Link>
  );
}
