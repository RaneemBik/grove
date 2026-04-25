import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Lock, CreditCard, Truck, ChevronRight, Gift, AlertCircle, Tag } from 'lucide-react';
import { orderApi, authApi } from '../api';
import { useCart } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import { fmt, imgUrl } from '../utils';
import { Input, Spinner } from '../components/ui';
import { useGiftBoxFees } from '../hooks/useGiftBoxFees';
import toast from 'react-hot-toast';
import type { Address } from '../types';

const schema = z.object({
  full_name: z.string().min(2, 'Required'),
  phone: z.string().min(5, 'Required'),
  street: z.string().min(3, 'Required'),
  apartment: z.string().optional(),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  postal_code: z.string().min(3, 'Required'),
  country: z.string().min(2, 'Required'),
  payment_method: z.string(),
  notes: z.string().optional(),
});
type F = z.infer<typeof schema>;

interface TotalBreakdown {
  subtotal: string;
  shipping_cost: string;
  tax: string;
  gift_box_total: string;
  base_discount: string;
  loyalty_credit: string;
  total: string;
  is_subscriber: boolean;
}

const STEPS = ['Shipping', 'Payment', 'Review'];

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [addrs, setAddrs] = useState<Address[]>([]);
  const [selAddr, setSelAddr] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<TotalBreakdown | null>(null);
  const [loadingTotal, setLoadingTotal] = useState(false);
  const { cart, fetch } = useCart();
  const { isAuthenticated } = useAuth();
  const { fees, clearFees } = useGiftBoxFees();
  const nav = useNavigate();

  const { register, handleSubmit, formState: { errors }, setValue, getValues, watch } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { payment_method: 'mock', country: 'United States' },
  });
  const pm = watch('payment_method');

  const normalizeAddresses = (data: any): Address[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  // Fetch the real backend total breakdown
  const fetchBreakdown = useCallback(async () => {
    setLoadingTotal(true);
    try {
      const giftBoxFees = fees.map(f => ({ name: f.name, price: f.price }));
      const { data } = await orderApi.calculateTotal(giftBoxFees);
      setBreakdown(data);
    } catch {
      setBreakdown(null);
    } finally {
      setLoadingTotal(false);
    }
  }, [fees]);

  useEffect(() => {
    if (!isAuthenticated) { nav('/auth/login?next=/checkout'); return; }
    fetch();
    authApi.addresses().then(r => {
      const addrList = normalizeAddresses(r.data);
      setAddrs(addrList);
      const def = addrList.find((a: Address) => a.is_default);
      if (def) { setSelAddr(def.id); fillAddr(def); }
    }).catch(() => {});
    fetchBreakdown();
  }, [isAuthenticated]);

  // Re-fetch breakdown whenever fees change
  useEffect(() => {
    if (isAuthenticated) fetchBreakdown();
  }, [fees.length]);

  const fillAddr = (a: Address) => {
    setValue('full_name', a.full_name);
    setValue('phone', a.phone);
    setValue('street', a.street_address);
    setValue('apartment', a.apartment || '');
    setValue('city', a.city);
    setValue('state', a.state);
    setValue('postal_code', a.postal_code);
    setValue('country', a.country);
  };

  const onSubmit = async (data: F) => {
    if (step < 2) { setStep(s => s + 1); return; }
    setPlacing(true);
    try {
      const giftBoxFees = fees.map(f => ({ name: f.name, price: f.price, order_id: f.orderId }));
      const payload = selAddr
        ? { address_id: selAddr, payment_method: data.payment_method, notes: data.notes, gift_box_fees: giftBoxFees }
        : {
            shipping_full_name: data.full_name,
            shipping_phone: data.phone,
            shipping_street: data.street,
            shipping_apartment: data.apartment,
            shipping_city: data.city,
            shipping_state: data.state,
            shipping_postal_code: data.postal_code,
            shipping_country: data.country,
            payment_method: data.payment_method,
            notes: data.notes,
            gift_box_fees: giftBoxFees,
          };

      const { data: res } = await orderApi.checkout(payload);

      if (res?.requires_payment && res?.checkout_url) {
        clearFees();
        toast.success('Redirecting to secure payment...');
        window.location.href = res.checkout_url;
        return;
      }
      clearFees();
      toast.success('Order placed successfully!');
      nav(`/account/orders/${res.order.order_number}`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to place order';
      toast.error(msg);
      (e?.response?.data?.errors || []).forEach((m: string) => toast.error(m, { duration: 5000 }));
    } finally {
      setPlacing(false);
    }
  };

  // Display values — always use backend breakdown when available
  const sub = breakdown ? parseFloat(breakdown.subtotal) : parseFloat(cart?.subtotal || '0');
  const ship = breakdown ? parseFloat(breakdown.shipping_cost) : (sub >= 100 ? 0 : 9.99);
  const tax = breakdown ? parseFloat(breakdown.tax) : sub * 0.08;
  const giftBoxTotal = breakdown ? parseFloat(breakdown.gift_box_total) : fees.reduce((s, f) => s + parseFloat(f.price), 0);
  const discount = breakdown ? parseFloat(breakdown.base_discount) : 0;
  const loyalty = breakdown ? parseFloat(breakdown.loyalty_credit) : 0;
  const total = breakdown ? parseFloat(breakdown.total) : sub + ship + tax + giftBoxTotal;
  const isSubscriber = breakdown?.is_subscriber ?? false;

  const hasItems = (cart?.items?.length ?? 0) > 0 || fees.length > 0;

  if (!hasItems) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Your cart is empty.</p>
      <Link to="/products" className="btn btn-primary">Go Shopping</Link>
    </div>
  );

  // Summary sidebar — shared between all steps
  const SummarySidebar = () => (
    <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', position: 'sticky', top: 90 }} className="checkout-summary">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--green)', marginBottom: 20 }}>
        Order Summary
      </h3>

      {loadingTotal ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner size={24} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <Row label="Subtotal" value={fmt(sub)} />
          <Row label="Shipping" value={ship === 0 ? 'Free' : fmt(ship)} valueStyle={{ color: ship === 0 ? '#16a34a' : undefined }} icon={<Truck size={12} />} />
          <Row label="Tax (8%)" value={fmt(tax)} />

          {fees.map(fee => (
            <Row key={fee.orderId} label={fee.name} value={fmt(fee.price)} icon={<Gift size={12} />} />
          ))}

          {discount > 0 && (
            <Row
              label={`Subscriber Discount`}
              value={`−${fmt(discount)}`}
              valueStyle={{ color: '#16a34a', fontWeight: 700 }}
              icon={<Tag size={12} />}
            />
          )}

          {loyalty > 0 && (
            <Row label="Loyalty Credit" value={`−${fmt(loyalty)}`} valueStyle={{ color: '#16a34a', fontWeight: 700 }} />
          )}

          <div style={{ borderTop: '2px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{fmt(total)}</span>
          </div>

          {isSubscriber && discount > 0 && (
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={11} /> Subscriber discount applied
            </div>
          )}

          {fees.length > 0 && (
            <div style={{ background: 'var(--green-pale)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gift size={12} color="var(--green)" />
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                {fees.length} gift box{fees.length > 1 ? 'es' : ''} included
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <Lock size={11} /> Secure SSL encrypted checkout
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      <div style={{ background: 'var(--green)', padding: '40px 0 32px' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 24 }}>Checkout</h1>
          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: 400 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: i < step ? 'pointer' : 'default' }} onClick={() => i < step && setStep(i)}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= step ? 'var(--lime)' : 'rgba(255,255,255,0.2)', color: i <= step ? 'var(--green)' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, transition: 'all 0.3s', flexShrink: 0 }}>
                    {i < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: i === step ? 'white' : 'rgba(255,255,255,0.5)', transition: 'color 0.3s' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? 'var(--lime)' : 'rgba(255,255,255,0.2)', margin: '0 10px', transition: 'background 0.3s' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

            {/* Form panel */}
            <div style={{ background: 'white', borderRadius: 24, padding: 32, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>

              {/* Step 0 — Shipping */}
              {step === 0 && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--green)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Truck size={18} style={{ color: 'var(--green-light)' }} /> Shipping Address
                  </h2>
                  {addrs.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)' }}>Saved Addresses</p>
                        {addrs.find(a => a.is_default) && (
                          <button type="button" onClick={() => { const def = addrs.find(a => a.is_default); if (def) { setSelAddr(def.id); fillAddr(def); } }} style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Use Default
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {addrs.map(a => (
                          <label key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, cursor: 'pointer', border: `2px solid ${selAddr === a.id ? 'var(--green-light)' : 'var(--border)'}`, background: selAddr === a.id ? 'var(--green-mist)' : 'white', transition: 'all 0.2s' }}>
                            <input type="radio" name="addr" checked={selAddr === a.id} onChange={() => { setSelAddr(a.id); fillAddr(a); }} style={{ accentColor: 'var(--green-light)', marginTop: 2 }} />
                            <div style={{ fontSize: 13, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <p style={{ fontWeight: 700, color: 'var(--text)' }}>{a.full_name}</p>
                                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize', background: a.is_default ? '#dcfce7' : '#f3f4f6', color: a.is_default ? '#16a34a' : '#6b7280', padding: '2px 8px', borderRadius: 4 }}>
                                  {a.address_type}{a.is_default ? ' • Default' : ''}
                                </span>
                              </div>
                              <p style={{ color: 'var(--text-muted)' }}>{a.street_address}{a.apartment ? `, ${a.apartment}` : ''}</p>
                              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.city}, {a.state} {a.postal_code}, {a.country}</p>
                            </div>
                          </label>
                        ))}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, cursor: 'pointer', border: `2px solid ${selAddr === null ? 'var(--green-light)' : 'var(--border)'}`, background: selAddr === null ? 'var(--green-mist)' : 'white' }}>
                          <input type="radio" name="addr" checked={selAddr === null} onChange={() => setSelAddr(null)} style={{ accentColor: 'var(--green-light)' }} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>+ Enter a new address</span>
                        </label>
                      </div>
                    </div>
                  )}
                  {(selAddr === null || addrs.length === 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16 }} className="addr-grid">
                      <div style={{ gridColumn: '1 / -1' }}><Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} /></div>
                      <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
                      <div style={{ gridColumn: '1 / -1' }}><Input label="Street Address" {...register('street')} error={errors.street?.message} /></div>
                      <Input label="Apartment/Suite" {...register('apartment')} />
                      <Input label="City" {...register('city')} error={errors.city?.message} />
                      <Input label="State" {...register('state')} error={errors.state?.message} />
                      <Input label="Postal Code" {...register('postal_code')} error={errors.postal_code?.message} />
                      <Input label="Country" {...register('country')} error={errors.country?.message} />
                    </div>
                  )}
                </div>
              )}

              {/* Step 1 — Payment */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--green)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CreditCard size={18} style={{ color: 'var(--green-light)' }} /> Payment Method
                  </h2>

                  {/* Show real total warning if loaded */}
                  {breakdown && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>
                          You will be charged exactly {fmt(total)}
                        </p>
                        <p style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                          This includes all discounts, tax, shipping, and gift box fees. The Stripe payment page will match this amount.
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { v: 'stripe', l: 'Card Payment (Stripe)', d: 'Secure hosted checkout — you will be redirected to Stripe' },
                      { v: 'mock', l: 'Demo Payment', d: 'Instant approval — for testing only' },
                      { v: 'cash_on_delivery', l: 'Cash on Delivery', d: 'Pay when your order arrives' },
                    ].map(opt => (
                      <label key={opt.v} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, cursor: 'pointer', border: `2px solid ${pm === opt.v ? 'var(--green-light)' : 'var(--border)'}`, background: pm === opt.v ? 'var(--green-mist)' : 'white', transition: 'all 0.2s' }}>
                        <input type="radio" {...register('payment_method')} value={opt.v} style={{ accentColor: 'var(--green-light)', marginTop: 2 }} />
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{opt.l}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.d}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>Order notes (optional)</label>
                    <textarea {...register('notes')} placeholder="Special delivery instructions..." className="input" rows={3} style={{ resize: 'none' }} />
                  </div>
                </div>
              )}

              {/* Step 2 — Review */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--green)', marginBottom: 24 }}>
                    Review Your Order
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {cart?.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', background: 'var(--green-mist)', flexShrink: 0 }}>
                          <img src={imgUrl(item.product.primary_image)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.product.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qty: {item.quantity}</p>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>{fmt(item.line_total)}</span>
                      </div>
                    ))}
                    {fees.map(fee => (
                      <div key={fee.orderId} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 10, background: 'var(--green-pale)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Gift size={24} color="var(--green-light)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>{fee.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gift wrapping fee</p>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>{fmt(fee.price)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Final total confirmation */}
                  <div style={{ marginTop: 20, background: 'var(--green)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Total to be charged</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color: 'var(--lime)' }}>{fmt(total)}</p>
                    </div>
                    <Lock size={20} color="rgba(255,255,255,0.5)" />
                  </div>

                  <div style={{ marginTop: 16, background: 'var(--green-mist)', borderRadius: 12, padding: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mid)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>Ship to</p>
                    <p style={{ fontSize: 13, color: 'var(--text)' }}>
                      {getValues('full_name')}, {getValues('street')}, {getValues('city')}, {getValues('country')}
                    </p>
                  </div>
                </div>
              )}

              {/* Nav buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }} className="checkout-nav-btns">
                <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : nav('/cart')} className="btn btn-outline btn-sm" style={{ borderRadius: 100, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                  {step === 0 ? 'Back to Cart' : 'Back'}
                </button>
                <button type="submit" disabled={placing} className="btn btn-primary" style={{ borderRadius: 100, minWidth: 160, gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {placing
                    ? <><Spinner size={15} cls="text-white" /> Placing...</>
                    : step === 2
                      ? <><Lock size={14} /> Place Order — {fmt(total)}</>
                      : <>Continue <ChevronRight size={15} /></>
                  }
                </button>
              </div>
            </div>

            {/* Summary sidebar */}
            <SummarySidebar />
          </div>
        </form>
      </div>
      <style>{`
        @media(max-width:900px){
          .checkout-layout{grid-template-columns:1fr !important;}
          .checkout-summary{position:static !important;}
        }
        @media(max-width:600px){
          .addr-grid{grid-template-columns:1fr !important;}
          .checkout-nav-btns{flex-direction:column-reverse;gap:10px;}
          .checkout-nav-btns button{width:100%;justify-content:center;}
        }
      `}</style>
    </div>
  );
}

// Small helper row component
function Row({ label, value, icon, valueStyle }: { label: string; value: string; icon?: React.ReactNode; valueStyle?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon} {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, ...valueStyle }}>{value}</span>
    </div>
  );
}
