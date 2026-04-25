import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productApi } from '../api';
import { fmt, imgUrl } from '../utils';
import { Button, Spinner, Empty, Pagination } from '../components/ui';
import { useCart } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import type { Product } from '../types';
import { showAddedToCartToast } from '../utils/cartToast';

interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [addingCart, setAddingCart] = useState<number | null>(null);
  const { add } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const token = localStorage.getItem('access_token');
    if (!token && !isAuthenticated) return;
    loadWishlist(1);
  }, [isAuthenticated, authLoading]);

  const loadWishlist = async (pg = 1) => {
    setLoading(true);
    try {
      const { data } = await productApi.wishlist(pg);
      // Handle paginated response
      if (data?.results) {
        setItems(data.results);
        setCount(data.count || 0);
        setPage(pg);
      } else if (Array.isArray(data)) {
        setItems(data);
        setCount(data.length);
        setPage(1);
      } else {
        setItems([]);
        setCount(0);
        setPage(1);
      }
    } catch (err: any) {
      console.error('Wishlist API Error:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message
      });
      const errorMsg = err?.response?.status === 401 
        ? 'Session expired. Please sign in again.'
        : err?.response?.data?.detail || 'Could not load wishlist';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (wishlistId: number) => {
    setRemoving(wishlistId);
    try {
      await productApi.removeWishlist(wishlistId);
      setItems(items.filter(item => item.id !== wishlistId));
      toast.success('Removed from wishlist');
    } catch (err: any) {
      toast.error('Could not remove from wishlist');
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setAddingCart(product.id);
    try {
      await add(product.id, 1);
      showAddedToCartToast(product.name);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add to cart');
    } finally {
      setAddingCart(null);
    }
  };

  const handleRemoveWishlist = async (e: React.MouseEvent, wishlistId: number) => {
    e.preventDefault();
    e.stopPropagation();
    await handleRemove(wishlistId);
  };

  if (loading || authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ background: 'var(--green)', padding: '40px 0 32px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Heart size={32} style={{ color: 'var(--lime)' }} fill="var(--lime)" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'white', margin: 0 }}>
              My Wishlist
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 600 }}>
            {items.length === 0
              ? 'Your wishlist is empty. Start adding products you love!'
              : `You have ${items.length} item${items.length !== 1 ? 's' : ''} in your wishlist`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '40px 24px 80px' }}>
        {items.length === 0 ? (
          <Empty
            icon={<Heart size={48} />}
            title="Your wishlist is empty"
            desc="Start adding your favorite products to your wishlist for easy access later"
            action={<Link to="/products" className="btn btn-primary">Continue Shopping</Link>}
          />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {items.map((item) => {
                const prod = item.product;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'white',
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--green-light)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'var(--shadow)';
                    }}
                  >
                  {/* Image Container */}
                  <Link
                    to={`/products/${prod.slug}`}
                    style={{
                      aspectRatio: '4/3',
                      background: 'var(--green-mist)',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      position: 'relative',
                      display: 'block',
                    }}
                  >
                    <img
                      src={imgUrl(prod.primary_image)}
                      alt={prod.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLImageElement).style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLImageElement).style.transform = 'scale(1)';
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />

                    {/* Badges */}
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                      {prod.is_featured && (
                        <span className="chip chip-green" style={{ fontSize: 10, fontWeight: 700 }}>
                          Featured
                        </span>
                      )}
                      {!prod.is_in_stock && (
                        <span className="chip chip-gray" style={{ fontSize: 10 }}>
                          Out of stock
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Link
                      to={`/products/${prod.slug}`}
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text)',
                        textDecoration: 'none',
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                      }}
                    >
                      {prod.name}
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>
                        {fmt(prod.price)}
                      </span>
                      {prod.compare_price && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {fmt(prod.compare_price)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                      <Button
                        onClick={(e: React.MouseEvent) => handleAddToCart(e, prod)}
                        loading={addingCart === prod.id}
                        disabled={!prod.is_in_stock}
                        size="sm"
                        style={{
                          flex: 1,
                          borderRadius: 10,
                          gap: 4,
                          fontSize: 12,
                          opacity: !prod.is_in_stock ? 0.5 : 1,
                        }}
                      >
                        <ShoppingBag size={13} />
                        {prod.is_in_stock ? 'Add' : 'Out'}
                      </Button>
                      <button
                        onClick={(e) => handleRemoveWishlist(e, item.id)}
                        disabled={removing === item.id}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          background: 'white',
                          cursor: removing === item.id ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          opacity: removing === item.id ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (removing !== item.id) {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.borderColor = '#fca5a5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <Trash2 size={13} style={{ color: '#e53e3e' }} />
                      </button>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} total={count} onChange={(pg) => loadWishlist(pg)} />
          </>
        )}
      </div>
    </div>
  );
}
