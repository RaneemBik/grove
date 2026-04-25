import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Gift, ChevronDown, Truck } from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { useCart } from '../../store/cartStore';

const CATEGORIES = [
  { label: 'Makeup', slug: 'makeup' },
  { label: 'Accessories', slug: 'accessories' },
  { label: 'Skin Care', slug: 'skin-care' },
  { label: 'Perfumes', slug: 'perfumes' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [q, setQ] = useState('');
  const { isAuthenticated } = useAuth();
  const { cart, toggle, fetch } = useCart();
  const nav = useNavigate();
  const loc = useLocation();
  const shopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setShopOpen(false); }, [loc.pathname, loc.search]);
  useEffect(() => { if (isAuthenticated) fetch(); }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) setShopOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cartCount = cart?.total_items || 0;
  const isActive = (path: string) => loc.pathname === path && !loc.search;

  return (
    <>
      {/* Announcement bar */}
      <div style={{ background: 'var(--green)', padding: '8px 0', textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--lime)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <Truck size={12} /> Free shipping on orders over $100 — Est. 2026
        </span>
      </div>

      <header style={{
        position: 'sticky', top: 0, zIndex: 40, transition: 'all 0.3s',
        background: scrolled ? 'rgba(250,248,243,0.95)' : 'var(--cream)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        boxShadow: scrolled ? 'var(--shadow)' : 'none',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 68, gap: 24 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--lime)' }}>G</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.03em' }}>Grove</span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }} className="hidden-mobile">

            <Link to="/" style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 100, color: isActive('/') ? 'var(--green)' : 'var(--text-mid)', background: isActive('/') ? 'var(--green-pale)' : 'transparent', transition: 'var(--transition)', textDecoration: 'none' }}>
              Home
            </Link>

            {/* Shop dropdown */}
            <div ref={shopRef} style={{ position: 'relative' }}>
              <button onClick={() => setShopOpen(v => !v)} style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 100, color: loc.pathname === '/products' ? 'var(--green)' : 'var(--text-mid)', background: loc.pathname === '/products' ? 'var(--green-pale)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'var(--transition)' }}>
                Shop <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: shopOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {shopOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid var(--border)', padding: 8, minWidth: 180, zIndex: 100 }}>
                  <Link to="/products" style={{ display: 'block', padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--green)', textDecoration: 'none' }} onClick={() => setShopOpen(false)}>
                    All Products
                  </Link>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  {CATEGORIES.map(cat => (
                    <Link key={cat.slug} to={`/products?category=${cat.slug}`} style={{ display: 'block', padding: '10px 16px', borderRadius: 10, fontSize: 14, color: 'var(--text-mid)', textDecoration: 'none', fontWeight: 500, transition: 'background 0.15s' }} onClick={() => setShopOpen(false)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-pale)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Gift Boxes */}
            <Link to="/gift-boxes" style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 100, color: loc.pathname === '/gift-boxes' ? 'var(--green)' : 'var(--text-mid)', background: loc.pathname === '/gift-boxes' ? 'var(--green-pale)' : 'transparent', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', transition: 'var(--transition)' }}>
              <Gift size={14} /> Gift Boxes
            </Link>

            {/* Seasonal Kits */}
            <Link to="/seasonal-kits" style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 100, color: loc.pathname === '/seasonal-kits' ? 'var(--green)' : 'var(--text-mid)', background: loc.pathname === '/seasonal-kits' ? 'var(--green-pale)' : 'transparent', textDecoration: 'none', transition: 'var(--transition)' }}>
              Seasonal Kits
            </Link>

            <Link to="/contact" style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 100, color: isActive('/contact') ? 'var(--green)' : 'var(--text-mid)', background: isActive('/contact') ? 'var(--green-pale)' : 'transparent', transition: 'var(--transition)', textDecoration: 'none' }}>
              Contact
            </Link>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setSearchOpen(v => !v)} className="btn-icon"><Search size={18} /></button>

            {isAuthenticated
              ? <Link to="/account" className="btn-icon"><User size={18} /></Link>
              : <Link to="/auth/login" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--green)', padding: '7px 16px', borderRadius: 100, border: '1.5px solid var(--green)', textDecoration: 'none' }} className="show-sm">Sign in</Link>
            }

            {isAuthenticated && (
              <button onClick={toggle} className="btn-icon" style={{ position: 'relative' }}>
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, background: 'var(--lime)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            )}

            <button onClick={() => setMobileOpen(v => !v)} className="btn-icon show-mobile">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="animate-fade-up" style={{ borderTop: '1px solid var(--border)', padding: '12px 0' }}>
            <div className="container">
              <form onSubmit={e => { e.preventDefault(); if (q) nav(`/products?search=${encodeURIComponent(q)}`); setSearchOpen(false); }} style={{ display: 'flex', gap: 10 }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products..." autoFocus className="input" style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
                <button type="button" onClick={() => setSearchOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,46,26,0.4)' }} onClick={() => setMobileOpen(false)} />
          <div className="animate-slide-right" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 280, background: 'var(--cream)', boxShadow: 'var(--shadow-xl)', paddingTop: 80, overflowY: 'auto' }}>
            <nav style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link to="/" style={{ padding: '12px 16px', borderRadius: 12, fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 16, color: isActive('/') ? 'var(--green)' : 'var(--text)', background: isActive('/') ? 'var(--green-pale)' : 'transparent', textDecoration: 'none' }}>Home</Link>
              <Link to="/products" style={{ padding: '12px 16px', borderRadius: 12, fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text)', textDecoration: 'none' }}>All Products</Link>
              {CATEGORIES.map(cat => (
                <Link key={cat.slug} to={`/products?category=${cat.slug}`} style={{ padding: '10px 16px 10px 28px', borderRadius: 12, fontSize: 14, color: 'var(--text-mid)', fontWeight: 500, textDecoration: 'none' }}>{cat.label}</Link>
              ))}
              <Link to="/gift-boxes" style={{ padding: '12px 16px', borderRadius: 12, fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 16, color: loc.pathname === '/gift-boxes' ? 'var(--green)' : 'var(--text)', background: loc.pathname === '/gift-boxes' ? 'var(--green-pale)' : 'transparent', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <Gift size={16} /> Gift Boxes
              </Link>
              <Link to="/seasonal-kits" style={{ padding: '12px 16px', borderRadius: 12, fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 16, color: loc.pathname === '/seasonal-kits' ? 'var(--green)' : 'var(--text)', background: loc.pathname === '/seasonal-kits' ? 'var(--green-pale)' : 'transparent', textDecoration: 'none' }}>
                Seasonal Kits
              </Link>
              <Link to="/contact" style={{ padding: '12px 16px', borderRadius: 12, fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text)', textDecoration: 'none' }}>Contact</Link>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
                {isAuthenticated
                  ? <Link to="/account" style={{ padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-mid)', textDecoration: 'none' }}><User size={16} /> My Account</Link>
                  : <>
                    <Link to="/auth/login" style={{ padding: '12px 16px', display: 'block', borderRadius: 12, color: 'var(--text-mid)', textDecoration: 'none' }}>Sign in</Link>
                    <Link to="/auth/register" style={{ padding: '12px 16px', display: 'block', borderRadius: 12, color: 'var(--green-light)', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
                  </>
                }
              </div>
            </nav>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:768px){.hidden-mobile{display:none!important;}.show-mobile{display:flex!important;}}
        @media(min-width:769px){.show-mobile{display:none!important;}.show-sm{display:inline-flex!important;}}
        .hidden-mobile{display:flex;}
        .show-sm{display:none;}
        .show-mobile{display:none;}
      `}</style>
    </>
  );
}
