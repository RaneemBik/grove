import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShoppingBag, ChevronRight, Package, Tag, CheckCircle } from 'lucide-react';
import { seasonalKitApi, cartApi } from '../api';
import { useCart } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import { fmt, imgUrl } from '../utils';
import { Spinner, Empty } from '../components/ui';
import { showAddedToCartToast } from '../utils/cartToast';
import type { SeasonalKit } from '../types';
import toast from 'react-hot-toast';

const PAGE_SIZE = 4;

export default function SeasonalKitsPage() {
  const [kits, setKits] = useState<SeasonalKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);
  const [addingKit, setAddingKit] = useState<string | null>(null);
  const [addedKits, setAddedKits] = useState<Set<string>>(new Set());
  const [expandedKit, setExpandedKit] = useState<number | null>(null);
  const { add, fetch: fetchCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    seasonalKitApi.list()
      .then(r => setKits(Array.isArray(r.data) ? r.data : (r.data?.results || [])))
      .catch(() => setKits([]))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(kits.length / PAGE_SIZE);
  const paged = kits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddProduct = async (productId: number, productName: string) => {
    if (!isAuthenticated) { toast.error('Please sign in to add products'); return; }
    setAddingProduct(productId);
    try {
      await add(productId, 1);
      showAddedToCartToast(productName);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not add to cart');
    } finally {
      setAddingProduct(null);
    }
  };

  const handleAddFullKit = async (kit: SeasonalKit) => {
    if (!isAuthenticated) { toast.error('Please sign in to add a kit'); return; }
    setAddingKit(kit.slug);
    try {
      const { data } = await cartApi.addKit(kit.slug);
      await fetchCart();
      setAddedKits(prev => new Set(prev).add(kit.slug));
      toast.custom((t) => (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--green)', color: 'white',
          padding: '12px 16px', borderRadius: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          fontFamily: 'var(--font-body)', fontSize: 14,
          opacity: t.visible ? 1 : 0, transition: 'opacity 0.3s',
          maxWidth: 360,
        }}>
          <Sparkles size={16} style={{ flexShrink: 0, color: '#c5e84a' }} />
          <span style={{ flex: 1 }}>
            <strong>{data.added_count} product{data.added_count !== 1 ? 's' : ''}</strong> from <strong>{kit.name}</strong> added
            {data.skipped_count > 0 && <span style={{ opacity: 0.75 }}> ({data.skipped_count} out of stock skipped)</span>}
          </span>
          <a href="/cart" onClick={() => toast.dismiss(t.id)}
            style={{ background: '#c5e84a', color: 'var(--green)', borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', textDecoration: 'none', flexShrink: 0 }}>
            View Cart
          </a>
        </div>
      ), { duration: 5000 });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not add kit to cart');
    } finally {
      setAddingKit(null);
    }
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ background: 'var(--green)', padding: '56px 24px 48px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(197,232,74,0.18)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
            <Sparkles size={14} color="var(--lime)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--lime)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Curated Collections</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 14 }}>
            Seasonal Glow Kits
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Admin-curated sets built around the season. Add the full kit in one click, or pick individual products.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '48px 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={44} /></div>
        ) : kits.length === 0 ? (
          <Empty icon={<Package size={56} />} title="No seasonal kits yet" desc="Check back soon." action={<Link to="/products" className="btn btn-primary">Browse Products</Link>} />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {paged.map((kit) => (
                <div key={kit.id} style={{ background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>

                  {/* Kit header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: 220 }} className="kit-header-grid">
                    {/* Image */}
                    <div style={{ background: 'var(--green-mist)', position: 'relative', overflow: 'hidden', minHeight: 220 }}>
                      {kit.image_url
                        ? <img src={kit.image_url} alt={kit.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}><Sparkles size={64} color="var(--green-light)" /></div>
                      }
                      {kit.badge && (
                        <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--green)', color: 'var(--lime)', borderRadius: 100, padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Tag size={10} /> {kit.badge}
                        </div>
                      )}
                    </div>

                    {/* Info + CTA */}
                    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em' }}>{kit.name}</h2>
                      {kit.description && <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7, maxWidth: 480 }}>{kit.description}</p>}
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Package size={13} /> {kit.item_count} product{kit.item_count !== 1 ? 's' : ''} in this kit
                      </p>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                        {/* Add Full Kit to Cart */}
                        <button
                          onClick={() => handleAddFullKit(kit)}
                          disabled={addingKit === kit.slug}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: addedKits.has(kit.slug) ? '#16a34a' : 'var(--green)',
                            color: 'white', border: 'none', borderRadius: 100,
                            padding: '12px 24px', fontSize: 14,
                            fontFamily: 'var(--font-display)', fontWeight: 700,
                            cursor: addingKit === kit.slug ? 'not-allowed' : 'pointer',
                            opacity: addingKit === kit.slug ? 0.7 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          {addingKit === kit.slug
                            ? <><Spinner size={14} /> Adding Kit...</>
                            : addedKits.has(kit.slug)
                              ? <><CheckCircle size={15} /> Kit Added to Cart</>
                              : <><ShoppingBag size={15} /> Add Full Kit to Cart</>
                          }
                        </button>

                        {/* Toggle product list */}
                        <button
                          onClick={() => setExpandedKit(expandedKit === kit.id ? null : kit.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'transparent', color: 'var(--green)',
                            border: '1.5px solid var(--green)', borderRadius: 100,
                            padding: '11px 20px', fontSize: 14,
                            fontFamily: 'var(--font-display)', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--green-pale)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          {expandedKit === kit.id ? 'Hide Products' : 'View Products'}
                          <ChevronRight size={14} style={{ transition: 'transform 0.2s', transform: expandedKit === kit.id ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                        </button>
                      </div>

                      {addedKits.has(kit.slug) && (
                        <p style={{ fontSize: 12, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> All kit products added — <a href="/cart" style={{ color: '#16a34a', fontWeight: 700 }}>View Cart</a>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expanded product grid */}
                  {expandedKit === kit.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '24px 28px 28px' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--green)', marginBottom: 16 }}>
                        Products in this kit — add individually or use "Add Full Kit to Cart" above
                      </p>
                      {kit.items.length === 0
                        ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No products added to this kit yet.</p>
                        : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(190px,100%),1fr))', gap: 14 }}>
                            {kit.items.map(item => (
                              <div key={item.id} style={{ background: 'var(--cream)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', transition: 'box-shadow 0.2s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                                <Link to={`/products/${item.product.slug}`}>
                                  <div style={{ aspectRatio: '4/3', background: 'var(--green-mist)', overflow: 'hidden' }}>
                                    <img
                                      src={imgUrl(item.product.primary_image)}
                                      alt={item.product.name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                      onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                      onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.07)'; }}
                                      onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                                    />
                                  </div>
                                </Link>
                                <div style={{ padding: '10px 12px 12px' }}>
                                  <Link to={`/products/${item.product.slug}`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, marginBottom: 3 }}>
                                    {item.product.name}
                                  </Link>
                                  {item.note && <p style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{item.note}</p>}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{fmt(item.product.price)}</span>
                                    <button
                                      onClick={() => handleAddProduct(item.product.id, item.product.name)}
                                      disabled={addingProduct === item.product.id || !item.product.is_in_stock}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        background: item.product.is_in_stock ? 'var(--green)' : 'var(--border)',
                                        color: 'white', border: 'none', borderRadius: 100,
                                        padding: '5px 12px', fontSize: 11, fontWeight: 600,
                                        cursor: item.product.is_in_stock ? 'pointer' : 'not-allowed',
                                        opacity: addingProduct === item.product.id ? 0.6 : 1,
                                      }}
                                    >
                                      {addingProduct === item.product.id ? <Spinner size={10} /> : <ShoppingBag size={10} />}
                                      {item.product.is_in_stock ? 'Add' : 'Out'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 48 }}>
                <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={page === 1}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 100, border: '1.5px solid var(--border)', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>
                  <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => { setPage(pg); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${pg === page ? 'var(--green)' : 'var(--border)'}`, background: pg === page ? 'var(--green)' : 'white', color: pg === page ? 'white' : 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {pg}
                  </button>
                ))}
                <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={page === totalPages}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 100, border: '1.5px solid var(--border)', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media(max-width:768px){
          .kit-header-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
