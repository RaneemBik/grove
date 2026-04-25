import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Gift, X, Truck } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import { fmt, imgUrl } from '../utils';
import { Spinner, Empty } from '../components/ui';
import { useGiftBoxFees } from '../hooks/useGiftBoxFees';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, loading, fetch, update, remove } = useCart();
  const { isAuthenticated } = useAuth();
  const { fees, totalFees, removeFee } = useGiftBoxFees();

  useEffect(() => { if (isAuthenticated) fetch(); }, [isAuthenticated]);

  const handleUpdate = async (id: number, qty: number) => {
    try { await update(id, qty); } catch (e: any) { toast.error(e?.response?.data?.message || 'Error'); }
  };
  const handleRemove = async (id: number) => {
    try { await remove(id); toast.success('Item removed'); } catch { toast.error('Error'); }
  };

  if (!isAuthenticated) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Empty icon={<ShoppingBag size={56} />} title="Sign in to view cart"
        action={<Link to="/auth/login" className="btn btn-primary">Sign In</Link>} />
    </div>
  );

  const sub = parseFloat(cart?.subtotal || '0');
  const ship = sub >= 100 ? 0 : 9.99;
  const tax = sub * 0.08;
  const total = sub + ship + tax + totalFees;
  const hasItems = (cart?.items?.length ?? 0) > 0 || fees.length > 0;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      <div style={{ background: 'var(--green)', padding: '40px 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>Your Cart</h1>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>
        ) : !hasItems ? (
          <Empty icon={<ShoppingBag size={56} />} title="Your cart is empty"
            desc="Discover our curated collection."
            action={<Link to="/products" className="btn btn-primary btn-lg">Start Shopping</Link>} />
        ) : (
          <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 32, alignItems: 'start' }}>

            {/* Items — span 2 cols */}
            <div style={{ gridColumn: '1 / 3' }} className="cart-items-col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Regular cart items */}
                {cart?.items.map(item => (
                  <div key={item.id} style={{ background: 'white', borderRadius: 20, padding: 20, display: 'flex', gap: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                    <Link to={`/products/${item.product.slug}`} style={{ width: 100, height: 100, borderRadius: 14, overflow: 'hidden', background: 'var(--green-mist)', flexShrink: 0 }}>
                      <img src={imgUrl(item.product.primary_image)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <Link to={`/products/${item.product.slug}`} style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.product.name}</Link>
                        <button onClick={() => handleRemove(item.id)} className="btn-icon" style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Trash2 size={16} /></button>
                      </div>
                      {item.product.category && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{item.product.category.name}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--border)', borderRadius: 100, padding: '5px 14px' }}>
                          <button onClick={() => item.quantity > 1 ? handleUpdate(item.id, item.quantity - 1) : handleRemove(item.id)} className="btn-icon" style={{ width: 24, height: 24, padding: 0 }}><Minus size={12} /></button>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                          <button onClick={() => handleUpdate(item.id, item.quantity + 1)} className="btn-icon" style={{ width: 24, height: 24, padding: 0 }}><Plus size={12} /></button>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: 'var(--green)' }}>{fmt(item.line_total)}</p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{fmt(item.unit_price)} each</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Gift box fee rows */}
                {fees.map(fee => (
                  <div key={fee.orderId} style={{ background: 'white', borderRadius: 20, padding: 20, display: 'flex', gap: 16, border: '2px solid var(--green-light)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ width: 100, height: 100, borderRadius: 14, background: 'var(--green-pale)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Gift size={36} color="var(--green-light)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{fee.name}</p>
                          <span style={{ display: 'inline-block', background: 'var(--green-pale)', color: 'var(--green)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                            Gift Wrapping
                          </span>
                        </div>
                        <button onClick={() => { removeFee(fee.orderId); toast.success('Gift box removed'); }} className="btn-icon" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                          <X size={16} />
                        </button>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                        Custom gift box — your products will be beautifully packaged.
                      </p>
                      <div style={{ marginTop: 10, textAlign: 'right' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: 'var(--green)' }}>{fmt(fee.price)}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>flat fee</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', position: 'sticky', top: 90 }} className="cart-summary-col">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--green)', marginBottom: 24 }}>Order Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-mid)' }}>Subtotal</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(sub)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: 5 }}><Truck size={13} /> Shipping</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: ship === 0 ? '#16a34a' : 'var(--text)' }}>
                    {ship === 0 ? 'Free' : fmt(ship)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-mid)' }}>Tax (8%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(tax)}</span>
                </div>

                {fees.map(fee => (
                  <div key={fee.orderId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Gift size={12} /> {fee.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(fee.price)}</span>
                  </div>
                ))}

                {ship > 0 && (
                  <div style={{ background: 'var(--green-pale)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--green)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={12} /> Add <strong style={{ margin: '0 3px' }}>{fmt(100 - sub)}</strong> more for free shipping
                  </div>
                )}

                <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{fmt(total)}</span>
                </div>
              </div>
              <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', borderRadius: 14, justifyContent: 'space-between', marginBottom: 10, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <span>Proceed to Checkout</span><ArrowRight size={16} />
              </Link>
              <Link to="/products" className="btn btn-ghost" style={{ width: '100%', borderRadius: 14, justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media(max-width:900px){
          .cart-items-col{grid-column:1 / -1 !important;}
          .cart-summary-col{grid-column:1 / -1 !important;position:static!important;}
          .cart-layout{grid-template-columns:1fr !important;}
        }
      `}</style>
    </div>
  );
}
