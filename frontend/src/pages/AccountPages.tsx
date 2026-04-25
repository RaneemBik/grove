import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, Outlet, useSearchParams } from 'react-router-dom';
import { User, Package, MapPin, Heart, LogOut, ChevronRight, Plus, Trash2, Star, Edit2, Check, X, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/authStore';
import { authApi, orderApi } from '../api';
import { fmt, fmtDate, imgUrl, STATUS_LABEL, STATUS_CHIP } from '../utils';
import { Input, Button, Spinner, Empty, Pagination, Modal } from '../components/ui';
import type { Order, Address } from '../types';
import toast from 'react-hot-toast';

// ── Layout ────────────────────────────────────────────────────────────────────
export function AccountLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const loc = window.location.pathname;

  useEffect(() => { if (!isAuthenticated) nav('/auth/login'); }, [isAuthenticated]);

  const handleLogout = async () => { await logout(); toast.success('Signed out'); nav('/'); };

  const nav_items = [
    { to: '/account', label: 'My Profile', icon: User, exact: true },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/account/orders', label: 'Orders', icon: Package },
    { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      <div style={{ background: 'var(--green)', padding: '40px 0 32px' }}>
        <div className="container">
          <h1 className="account-page-title" style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'white' }}>My Account</h1>
        </div>
      </div>
      <div className="container account-content-wrap" style={{ padding: '40px 24px 80px' }}>
          <div className="account-layout-shell" style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <aside style={{ width: 240, flexShrink: 0, display: 'none' }} className="account-sidebar">
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: 12 }}>
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--green-light)' }}>{user?.first_name?.[0] || 'U'}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || user?.username}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                </div>
              </div>
              {nav_items.map(item => {
                const active = item.exact ? loc === item.to : loc.startsWith(item.to);
                return (
                  <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: '1px solid var(--border)', background: active ? 'var(--green-mist)' : 'white', color: active ? 'var(--green)' : 'var(--text-mid)', fontWeight: active ? 700 : 400, fontSize: 14, transition: 'all 0.2s' }}>
                    <item.icon size={15} /> {item.label} {active && <ChevronRight size={13} style={{ marginLeft: 'auto' }} />}
                  </Link>
                );
              })}
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', background: 'white', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, fontFamily: 'var(--font-body)', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream-dark)')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </aside>
          {/* Mobile nav */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }} className="account-mobile-nav">
            {nav_items.map(item => {
              const active = item.exact ? loc === item.to : loc.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to} className="account-mobile-chip" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: active ? 700 : 500, background: active ? 'var(--green)' : 'white', color: active ? 'white' : 'var(--text-mid)', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
                  <item.icon size={13} />{item.label}
                </Link>
              );
            })}
            <button onClick={handleLogout} className="account-mobile-chip" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, fontSize: 13, background: 'white', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <LogOut size={13} />Sign Out
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}><Outlet /></div>
        </div>
      </div>
      <style>{`
        @media(min-width:900px){.account-sidebar{display:block!important;}.account-mobile-nav{display:none!important;}}
        @media(max-width:899px){
          .account-layout-shell{flex-direction:column!important;gap:16px!important;}
          .account-mobile-nav{width:100%;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));}
          .account-mobile-chip{width:100%;justify-content:center;}
        }
        @media(max-width:700px){
          .account-content-wrap{padding:20px 14px 56px!important;}
          .account-page-title{font-size:clamp(1.9rem,8vw,2.2rem)!important;}
          .account-card{padding:18px!important;border-radius:16px!important;}
          .account-card-header{flex-wrap:wrap;align-items:flex-start!important;gap:10px!important;}
          .account-two-col{grid-template-columns:1fr!important;}
          .order-progress-wrap{overflow-x:auto;}
          .order-progress-row{min-width:520px;}
          .account-order-row{flex-wrap:wrap;gap:10px!important;padding:14px!important;}
          .account-order-total{margin-left:auto;}
          .account-order-chevron{display:none!important;}
          .order-item-row{align-items:flex-start!important;}
          .order-item-total{width:100%;text-align:right;}
          .account-reset-btn{margin-left:0!important;width:100%;}
        }
        @media(max-width:520px){.account-mobile-nav{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, fetchProfile, logout } = useAuth();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: resetRegister, handleSubmit: resetHandleSubmit, reset: resetReset, formState: { errors: resetErrors, isSubmitting: resetSubmitting } } = useForm();

  useEffect(() => { if (user) reset({ first_name: user.first_name, last_name: user.last_name, username: user.username, phone: user.phone }); }, [user]);

  useEffect(() => {
    const sub = sp.get('subscription');
    const sessionId = sp.get('session_id');
    if (sub !== 'success' || !sessionId) return;

    setSubLoading(true);
    authApi.confirmSubscription(sessionId)
      .then(async (r) => {
        await fetchProfile();
        toast.success(r?.data?.message || 'Subscription activated');
      })
      .catch((e: any) => {
        toast.error(e?.response?.data?.message || 'Could not confirm subscription');
      })
      .finally(() => {
        const cleaned = new URLSearchParams(sp);
        cleaned.delete('subscription');
        cleaned.delete('session_id');
        setSp(cleaned, { replace: true });
        setSubLoading(false);
      });
  }, [sp.toString()]);

  const onSubmit = async (d: any) => {
    setSaving(true);
    try { await authApi.updateProfile(d); await fetchProfile(); toast.success('Profile updated!'); }
    catch { toast.error('Could not update'); }
    finally { setSaving(false); }
  };

  const onResetPassword = async (d: any) => {
    setResetting(true);
    try {
      await authApi.resetPassword({
        old_password: d.old_password,
        new_password: d.new_password,
        new_password2: d.new_password2,
      });
      toast.success('Password reset successfully! Please log in with your new password.');
      setShowResetDialog(false);
      resetReset();
      // Logout and redirect to login
      setTimeout(async () => {
        await logout();
        nav('/auth/login');
      }, 1500);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not reset password');
    } finally {
      setResetting(false);
    }
  };

  const startSubscription = async (plan: 'monthly' | 'yearly') => {
    setSubLoading(true);
    try {
      const { data } = await authApi.subscribe(plan);
      await fetchProfile();
      toast.success(data?.message || 'Subscription activated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not start subscription');
    } finally {
      setSubLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setSubLoading(true);
    try {
      const { data } = await authApi.cancelSubscription();
      await fetchProfile();
      toast.success(data?.message || 'Subscription cancelled');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not cancel subscription');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="account-card" style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--green)', marginBottom: 24 }}>My Profile</h2>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="account-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16 }}>
            <Input label="First Name" {...register('first_name', { required: true })} />
            <Input label="Last Name" {...register('last_name', { required: true })} />
          </div>
          <Input label="Username" {...register('username', { required: true })} />
          <Input label="Email" value={user?.email || ''} disabled />
          <Input label="Phone" type="tel" {...register('phone')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" loading={saving} style={{ borderRadius: 12, gap: 8 }}>Save Changes</Button>
          </div>
        </form>
      </div>
      <div className="account-card" style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--green)', marginBottom: 16 }}>Account Details</h2>
        <div className="account-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16, fontSize: 14 }}>
          <div><p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Member since</p><p style={{ fontWeight: 600 }}>{user?.date_joined ? fmtDate(user.date_joined) : '—'}</p></div>
          <div><p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Account type</p><p style={{ fontWeight: 600 }}>{user?.is_staff ? 'Administrator' : 'Customer'}</p></div>
          <div><p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Membership</p><p style={{ fontWeight: 600 }}>{user?.is_subscriber ? `Subscriber (${user.subscription_plan})` : 'Standard'}</p></div>
          <div><p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Loyalty points</p><p style={{ fontWeight: 600 }}>{user?.loyalty_points ?? 0}</p></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {!user?.is_subscriber ? (
            <>
              <Button size="sm" loading={subLoading} onClick={() => startSubscription('monthly')} style={{ borderRadius: 100 }}>Subscribe Monthly</Button>
              <Button size="sm" loading={subLoading} onClick={() => startSubscription('yearly')} variant="outline" style={{ borderRadius: 100 }}>Subscribe Yearly</Button>
            </>
          ) : (
            <Button size="sm" loading={subLoading} onClick={cancelSubscription} variant="outline" style={{ borderRadius: 100 }}>Cancel Subscription</Button>
          )}
          <Button className="account-reset-btn" size="sm" variant="outline" onClick={() => setShowResetDialog(true)} style={{ borderRadius: 100, marginLeft: 'auto' }}>Change Password</Button>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal open={showResetDialog} onClose={() => { setShowResetDialog(false); resetReset(); }} title="Change Password">
        <form onSubmit={resetHandleSubmit(onResetPassword)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            {...resetRegister('old_password', { required: 'Current password is required' })}
            error={resetErrors.old_password?.message}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter a new password (min 8 characters)"
            {...resetRegister('new_password', { required: 'New password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
            error={resetErrors.new_password?.message}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            {...resetRegister('new_password2', { required: 'Please confirm your password' })}
            error={resetErrors.new_password2?.message}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="outline" type="button" onClick={() => { setShowResetDialog(false); resetReset(); }} style={{ borderRadius: 12 }}>Cancel</Button>
            <Button type="submit" loading={resetSubmitting} style={{ borderRadius: 12 }}>Reset Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p: number) => {
    setLoading(true);
    try { const { data } = await orderApi.list(p); setOrders(data.results); setCount(data.count); setPage(p); }
    catch { toast.error('Could not load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);

  return (
    <>
      <div className="account-card" style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="account-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>Order History</h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>{count} orders</span>
        </div>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={36} /></div>
          : orders.length === 0 ? <Empty icon={<Package size={48} />} title="No orders yet" desc="Your order history will appear here." action={<Link to="/products" className="btn btn-primary btn-sm">Start Shopping</Link>} />
          : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(o => (
                  <Link key={o.id} to={`/account/orders/${o.order_number}`} className="account-order-row" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--cream)', textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-light)'; (e.currentTarget as HTMLElement).style.background = 'var(--green-mist)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={18} style={{ color: 'var(--green-light)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{o.order_number}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fmtDate(o.created_at)}</p>
                    </div>
                    <span className={`chip ${STATUS_CHIP[o.status] || 'chip-gray'}`}>{STATUS_LABEL[o.status]}</span>
                    <span className="account-order-total" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>{fmt(o.total)}</span>
                    <ChevronRight size={16} className="account-order-chevron" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </>
          )}
      </div>
    </>
  );
}

// ── Order Detail ──────────────────────────────────────────────────────────────
const STEPS_ORD = ['pending','paid','processing','shipped','delivered'];

export function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [sp, setSp] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    orderApi.detail(orderNumber!).then(r => setOrder(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [orderNumber]);

  useEffect(() => {
    const payment = sp.get('payment');
    const sessionId = sp.get('session_id');
    if (payment !== 'success' || !sessionId || !orderNumber) return;

    orderApi.confirmStripePayment(orderNumber, sessionId)
      .then(r => {
        setOrder(r.data.order);
        toast.success('Payment confirmed');
      })
      .catch((e: any) => {
        toast.error(e?.response?.data?.message || 'Could not confirm payment');
      })
      .finally(() => {
        const cleaned = new URLSearchParams(sp);
        cleaned.delete('payment');
        cleaned.delete('session_id');
        setSp(cleaned, { replace: true });
      });
  }, [orderNumber, sp.toString()]);

  const handleCancel = async () => {
    
    setCancelling(true);
    try { const { data } = await orderApi.cancel(orderNumber!); setOrder(data.order); toast.success('Order cancelled'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not cancel'); }
    finally { setCancelling(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={36} /></div>;
  if (!order) return <div style={{ textAlign: 'center', padding: 40 }}><p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Order not found</p><button onClick={() => nav('/account/orders')} className="btn btn-primary btn-sm">Back to Orders</button></div>;

  const stepIdx = STEPS_ORD.indexOf(order.status);
  const cancellable = ['pending','paid'].includes(order.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button onClick={() => nav('/account/orders')} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>Back to Orders</button>
        {cancellable && <Button variant="outline" size="sm" loading={cancelling} onClick={handleCancel} style={{ borderRadius: 100, borderColor: '#e53e3e', color: '#e53e3e' }}>Cancel Order</Button>}
      </div>

      <div className="account-card" style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Order</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{order.order_number}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{fmtDate(order.created_at)}</p>
          </div>
          <span className={`chip ${STATUS_CHIP[order.status] || 'chip-gray'}`} style={{ fontSize: 14, padding: '8px 16px', alignSelf: 'flex-start' }}>{STATUS_LABEL[order.status]}</span>
        </div>

        {!['cancelled','refunded'].includes(order.status) && (
          <div className="order-progress-wrap" style={{ marginBottom: 0 }}>
            <div className="order-progress-row" style={{ display: 'flex', alignItems: 'center' }}>
              {STEPS_ORD.map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= stepIdx ? 'var(--lime)' : 'var(--sand)', color: i <= stepIdx ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{i < stepIdx ? '✓' : i+1}</div>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: i <= stepIdx ? 'var(--green-mid)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: 56 }}>{STATUS_LABEL[s]}</span>
                  </div>
                  {i < STEPS_ORD.length-1 && <div style={{ flex: 1, height: 2, background: i < stepIdx ? 'var(--lime)' : 'var(--sand)', marginBottom: 20 }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={15} />Shipping Address</h3>
          <div style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8 }}>
            <p style={{ fontWeight: 600, color: 'var(--text)' }}>{order.shipping_full_name}</p>
            <p>{order.shipping_phone}</p><p>{order.shipping_street}{order.shipping_apartment && `, ${order.shipping_apartment}`}</p>
            <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p><p>{order.shipping_country}</p>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 14 }}>Payment Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            {[['Subtotal', fmt(order.subtotal)], ['Shipping', parseFloat(order.shipping_cost)===0?'Free':fmt(order.shipping_cost)], ['Tax', fmt(order.tax)]].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--text-muted)' }}>{k}</span><span style={{ fontFamily:'var(--font-mono)' }}>{v}</span></div>
            ))}
            <div style={{ borderTop:'2px solid var(--border)', paddingTop:10, display:'flex', justifyContent:'space-between', fontWeight:700 }}>
              <span>Total</span><span style={{ fontFamily:'var(--font-mono)', fontSize:18, color:'var(--green)' }}>{fmt(order.total)}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:order.is_paid?'#4ade80':'var(--sand)' }}/>
              <span style={{ fontSize:12, color:order.is_paid?'#16a34a':'var(--text-muted)' }}>{order.is_paid?'Paid':'Awaiting payment'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="account-card" style={{ background:'white', borderRadius:20, padding:28, border:'1px solid var(--border)', boxShadow:'var(--shadow)' }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--green)', marginBottom:20 }}>Order Items</h3>
        {order.items.map(item=>(
          <div className="order-item-row" key={item.id} style={{ display:'flex', gap:16, padding:'14px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
            <div style={{ width:72, height:72, borderRadius:12, overflow:'hidden', background:'var(--green-mist)', flexShrink:0 }}>
              <img src={imgUrl(item.product_image)} alt={item.product_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ (e.target as HTMLImageElement).src='/placeholder.svg'; }}/>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{item.product_name}</p>
              {item.product_sku && <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>SKU: {item.product_sku}</p>}
              <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Qty: {item.quantity} × {fmt(item.unit_price)}</p>
            </div>
            <span className="order-item-total" style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--green)', flexShrink:0 }}>{fmt(item.line_total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Addresses ─────────────────────────────────────────────────────────────────
export function AddressesPage() {
  const [addrs, setAddrs] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.addresses();
      // Handle paginated response safely
      if (data?.results && Array.isArray(data.results)) {
        setAddrs(data.results);
      } else if (Array.isArray(data)) {
        setAddrs(data);
      } else {
        setAddrs([]);
      }
    } catch (err: any) {
      console.error('Address load error:', err);
      setError(err?.response?.data?.message || 'Could not load addresses');
      setAddrs([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (d: any) => {
    try {
      if (editing) {
        await authApi.updateAddress(editing.id, d);
        toast.success('Address updated');
      } else {
        await authApi.createAddress(d);
        toast.success('Address added');
      }
      setShowForm(false);
      setEditing(null);
      reset();
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not save address');
    }
  };

  const startEdit = (a: Address) => {
    setEditing(a); setShowForm(true);
    reset({ full_name: a.full_name, phone: a.phone, street_address: a.street_address, apartment: a.apartment, city: a.city, state: a.state, postal_code: a.postal_code, country: a.country, is_default: a.is_default });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="account-card" style={{ background:'white', borderRadius:20, padding:28, border:'1px solid var(--border)', boxShadow:'var(--shadow)' }}>
        <div className="account-card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--green)' }}>Saved Addresses</h2>
          <Button onClick={()=>{ setShowForm(true); setEditing(null); reset(); }} size="sm" style={{ borderRadius:100, gap:6 }}><Plus size={14}/>Add Address</Button>
        </div>
        {loading ? <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner/></div>
          : addrs.length===0 && !showForm ? <Empty icon={<MapPin size={48}/>} title="No addresses" desc="Add an address to speed up checkout." action={<Button onClick={()=>setShowForm(true)} size="sm" style={{ borderRadius:100, gap:6 }}><Plus size={14}/>Add Address</Button>}/>
          : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {addrs.map(a=>(
                <div key={a.id} style={{ borderRadius:16, padding:18, border:`2px solid ${a.is_default?'var(--green-light)':'var(--border)'}`, background:a.is_default?'var(--green-mist)':'var(--cream)', position:'relative' }}>
                  {a.is_default && <span className="chip chip-green" style={{ position:'absolute', top:14, right:14, fontSize:10 }}>Default</span>}
                  <div style={{ fontSize:14, lineHeight:1.8, color:'var(--text-mid)', paddingRight:a.is_default?64:0 }}>
                    <p style={{ fontWeight:700, color:'var(--text)' }}>{a.full_name}</p>
                    <p>{a.phone}</p><p>{a.street_address}{a.apartment&&`, ${a.apartment}`}</p>
                    <p>{a.city}, {a.state} {a.postal_code}</p><p>{a.country}</p>
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
                    <button onClick={()=>startEdit(a)} className="btn btn-ghost btn-sm" style={{ borderRadius:100, gap:4, padding:'5px 12px', fontSize:12 }}><Edit2 size={11}/>Edit</button>
                    {!a.is_default && <button onClick={async()=>{ await authApi.setDefault(a.id); toast.success('Default updated'); load(); }} className="btn btn-ghost btn-sm" style={{ borderRadius:100, gap:4, padding:'5px 12px', fontSize:12 }}><Star size={11}/>Default</button>}
                    <button onClick={async()=>{  await authApi.deleteAddress(a.id); toast.success('Deleted'); load(); }} className="btn btn-ghost btn-sm" style={{ borderRadius:100, gap:4, padding:'5px 12px', fontSize:12, color:'#e53e3e', marginLeft:'auto' }}><Trash2 size={11}/>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {error && (
        <div style={{ background:'#fee2e2', borderRadius:16, padding:16, border:'1px solid #fca5a5', color:'#c53030', marginBottom:16 }}>
          <p style={{ margin:0, fontSize:14 }}>{error}</p>
        </div>
      )}

      {showForm && (
        <div className="account-card" style={{ background:'white', borderRadius:20, padding:28, border:'1px solid var(--border)', boxShadow:'var(--shadow)' }}>
          <div className="account-card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--green)' }}>{editing?'Edit':'New'} Address</h3>
            <button type="button" onClick={()=>{ setShowForm(false); setEditing(null); reset(); }} className="btn-icon" style={{ cursor:'pointer' }}><X size={18}/></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="account-two-col" style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:16 }}>
            <div style={{ gridColumn:'1/-1' }}><Input label="Full Name" {...register('full_name',{required:true})}/></div>
            <Input label="Phone" {...register('phone',{required:true})}/>
            <div style={{ gridColumn:'1/-1' }}><Input label="Street Address" {...register('street_address',{required:true})}/></div>
            <Input label="Apartment/Suite" {...register('apartment')}/>
            <Input label="City" {...register('city',{required:true})}/>
            <Input label="State/Province" {...register('state',{required:true})}/>
            <Input label="Postal Code" {...register('postal_code',{required:true})}/>
            <Input label="Country" {...register('country',{required:true})}/>
            <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" {...register('is_default')} style={{ accentColor:'var(--green-light)', width:15, height:15 }}/>
              <span style={{ fontSize:14, color:'var(--text-mid)' }}>Set as default address</span>
            </div>
            <div style={{ gridColumn:'1/-1', display:'flex', gap:10, justifyContent:'flex-end' }}>
              <Button type="button" variant="outline" size="sm" style={{ borderRadius:100 }} onClick={()=>{ setShowForm(false); setEditing(null); reset(); }}>Cancel</Button>
              <Button type="submit" loading={isSubmitting} size="sm" style={{ borderRadius:100, gap:6 }}><Check size={13}/>{editing?'Update':'Save'}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

