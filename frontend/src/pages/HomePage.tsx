import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, Shield, Star, Sparkles, Gift } from 'lucide-react';
import { productApi } from '../api';
import ProductCard from '../components/products/ProductCard';
import { Skeleton } from '../components/ui';
import type { Product, Category } from '../types';
import { imgUrl } from '../utils';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  const getProductCategoryId = (p: Product): number | null => {
    const raw = (p as any).category;
    if (typeof raw === 'number') return raw;
    if (raw && typeof raw === 'object' && typeof raw.id === 'number') return raw.id;
    return null;
  };

  // Headline/subline for each category slug
  const catCopy: Record<string, { headline: string; subline: string }> = {
    'makeup': {
      headline: 'Luxury Makeup',
      subline: 'Iconic formulas and colours from the world\'s most coveted beauty brands.',
    },
    'accessories': {
      headline: 'Fine Accessories',
      subline: 'Timeless jewellery and premium pieces for every celebration.',
    },
    'skin-care': {
      headline: 'Skin Care',
      subline: 'Hydrating, soothing, and glow-focused formulas curated for every skin journey.',
    },
    'perfumes': {
      headline: 'Luxury Perfumes',
      subline: 'Timeless fragrances blending sophistication and character for every occasion.',
},
  };

  const heroSlides = cats.slice(0, 4).map((cat) => {
    const categoryProducts = featured.filter(p => getProductCategoryId(p) === cat.id);
    const featuredMatch =
      categoryProducts.find(p => p.is_featured && p.primary_image) ||
      categoryProducts.find(p => p.primary_image) ||
      categoryProducts[0] || null;

    const slideImage = imgUrl(featuredMatch?.primary_image || cat.image || '/placeholder.svg');
    const copy = catCopy[cat.slug] || {
      headline: `${cat.name} Essentials`,
      subline: `Discover premium ${cat.name.toLowerCase()} picks selected for you.`,
    };

    return { id: cat.id, name: cat.name, slug: cat.slug, src: slideImage, ...copy };
  }).filter(s => !!s.src);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const id = window.setInterval(() => setHeroIndex(prev => (prev + 1) % heroSlides.length), 3600);
    return () => window.clearInterval(id);
  }, [heroSlides.length]);

  useEffect(() => {
    const toList = <T,>(data: any): T[] =>
      Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);

    Promise.all([
      productApi.featured().then(r => setFeatured(toList<Product>(r.data).filter(p => p.is_featured).slice(0, 8))),
      productApi.newArrivals().then(r => setNewArrivals(toList<Product>(r.data).slice(0, 8))),
      productApi.categories().then(r => {
        // Only show our 4 target categories, in order
        const order = ['makeup', 'accessories', 'skin-care', 'perfumes'];
        const all: Category[] = toList<Category>(r.data);
        const sorted = order.map(slug => all.find(c => c.slug === slug)).filter(Boolean) as Category[];
        // Append any remaining not in the order list
        const rest = all.filter(c => !order.includes(c.slug));
        setCats([...sorted, ...rest].slice(0, 4));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const catColors = ['#e8f5e3', '#faf3de', '#ebf0e6', '#f4e6dc'];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="home-hero" style={{ minHeight: 'calc(100svh - var(--landing-chrome) - var(--landing-marquee))', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-bg-stack" aria-hidden="true">
          {(heroSlides.length ? heroSlides : [{ id: 0, name: 'Grove', src: '/placeholder.svg', headline: 'Curated Living', subline: 'Shop thoughtfully selected essentials.', slug: 'all' }]).map((slide, idx) => (
            <div
              key={slide.id}
              className={`hero-bg-slide ${idx === heroIndex ? 'active' : ''}`}
              style={{ backgroundImage: `linear-gradient(120deg, rgba(137,108,108,0.78) 0%, rgba(137,108,108,0.42) 45%, rgba(229,190,181,0.22) 100%), url(${slide.src})` }}
            />
          ))}
        </div>

        <div className="container home-hero-inner" style={{ position: 'relative', zIndex: 2, padding: 'clamp(10px,2vh,28px) 24px' }}>
          <div style={{ maxWidth: 640 }}>
            <p className="animate-fade-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dark)', marginBottom: 14 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cream-dark)', display: 'inline-block' }} />
              Featured Category
            </p>

            <h1 key={`hero-title-${heroSlides[heroIndex]?.id ?? 'default'}`} className="animate-fade-up d2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem,5.2vw,5rem)', fontWeight: 800, color: 'white', lineHeight: 1.02, letterSpacing: '-0.03em', marginBottom: 12 }}>
              {heroSlides[heroIndex]?.headline || 'Curated For Modern Living'}
            </h1>

            <p key={`hero-sub-${heroSlides[heroIndex]?.id ?? 'default'}`} className="animate-fade-up d3" style={{ fontSize: 16, color: 'rgba(255,255,255,0.86)', lineHeight: 1.6, maxWidth: 520, marginBottom: 24 }}>
              {heroSlides[heroIndex]?.subline || 'Explore essentials selected to elevate your everyday routine.'}
            </p>

            <div className="animate-fade-up d4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <Link to={heroSlides[heroIndex] ? `/products?category=${heroSlides[heroIndex].slug}` : '/products'} className="btn btn-lime btn-lg">
                Shop This Category <ArrowRight size={18} />
              </Link>
              <Link to="/products" className="btn" style={{ background: 'rgba(245,250,225,0.16)', color: 'white', border: '1.5px solid rgba(245,250,225,0.6)', padding: '17px 32px', borderRadius: 100, fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                View All Products
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {heroSlides.map((slide, idx) => (
                <button
                  key={`dot-${slide.id}`}
                  onClick={() => setHeroIndex(idx)}
                  aria-label={`Show ${slide.name}`}
                  style={{ width: idx === heroIndex ? 34 : 12, height: 12, borderRadius: 999, border: 'none', background: idx === heroIndex ? 'var(--cream-dark)' : 'rgba(245,250,225,0.48)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee perks ── */}
      <div style={{ background: 'var(--cream-dark)', padding: '10px 0', overflow: 'hidden', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="marquee-wrapper">
          <div className="marquee-track" style={{ gap: 48 }}>
            {[...Array(2)].map((_, rep) => (
              ['Free Shipping $100+', '30-Day Returns', 'Secure Checkout', 'Eco-Friendly Packaging', 'Handpicked Quality', 'Customer Obsessed', 'Makeup · Skin Care · Accessories · Perfumes'].map((t, i) => (
                <span key={`${rep}-${i}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--green-light)', borderRadius: '50%', display: 'inline-block' }} />
                  {t}
                </span>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="tag tag-green" style={{ marginBottom: 12 }}>Explore</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em' }}>Shop by Category</h2>
            </div>
            <Link to="/products" className="btn btn-outline btn-sm" style={{ borderRadius: 100 }}>All Products <ArrowRight size={14} /></Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={220} radius="20px" />)
              : cats.map((cat, i) => (
                <Link key={cat.id} to={`/products?category=${cat.slug}`}
                  className="animate-fade-up cat-card"
                  style={{
                    animationDelay: `${i * 0.08}s`, display: 'flex', flexDirection: 'column',
                    borderRadius: 20, overflow: 'hidden', border: '1.5px solid var(--border)',
                    textDecoration: 'none', transition: 'transform 0.25s, box-shadow 0.25s',
                    background: 'white', boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* Category image */}
                  <div style={{ aspectRatio: '4/3', background: catColors[i % catColors.length], overflow: 'hidden', position: 'relative' }}>
                    {cat.image
                      ? <img src={imgUrl(cat.image)} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, color: 'var(--green-light)', fontStyle: 'italic' }}>{cat.name[0]}</span>
                        </div>
                    }
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,44,28,0.35) 0%, transparent 60%)' }} />
                  </div>
                  {/* Label */}
                  <div style={{ padding: '14px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{cat.name}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{cat.product_count} items</p>
                    </div>
                    <ArrowRight size={16} color="var(--green-light)" />
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </section>

      {/* ── Gift Box banner ── */}
      <section style={{ background: 'var(--green)', padding: '56px 24px' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 32, alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lime)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gift size={12} /> New Feature
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Build a Custom Gift Box
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.65, marginBottom: 24, maxWidth: 420 }}>
              Choose a box, fill it with your favourite Grove products, and send it as one beautiful gift — starting from just $3.
            </p>
            <Link to="/gift-boxes" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--lime)', color: 'var(--green)', padding: '14px 28px', borderRadius: 100, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              <Gift size={18} /> Build Your Box
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[{ label: 'Classic Box', price: '$5' }, { label: 'Luxury Box', price: '$12' }, { label: 'Mini Box', price: '$3' }].map(b => (
              <div key={b.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px 24px', textAlign: 'center', minWidth: 100, border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                  <Gift size={32} color="var(--lime)" />
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: 14 }}>{b.label}</p>
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--lime)', fontSize: 13, fontWeight: 700 }}>{b.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seasonal Kits teaser ── */}
      <section style={{ background: 'var(--cream-dark)', padding: '56px 24px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--green-pale)', color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 100 }}>
                <Sparkles size={12} /> Curated Sets
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em' }}>Seasonal Glow Kits</h2>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 8, maxWidth: 440 }}>Admin-curated kits built around the season — add individual items or shop the full collection.</p>
            </div>
            <Link to="/seasonal-kits" className="btn btn-outline btn-sm" style={{ borderRadius: 100, display: 'flex', alignItems: 'center', gap: 6 }}>View All Kits <ArrowRight size={14} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%),1fr))', gap: 20 }}>
            {[
              { name: 'Summer Glow Kit', badge: 'Summer Edition', desc: 'Charlotte Tilbury Skincare Discovery Set.', slug: 'summer-glow-kit' },
              { name: 'Winter Repair Kit', badge: 'Winter Edition', desc: 'Heavy moisturiser, lip balm and repair serum.', slug: 'winter-repair-kit' },
              { name: 'Eid Beauty Box', badge: 'Eid Special', desc: 'Long-lasting makeup and setting spray for celebrations.', slug: 'eid-beauty-box' },
            ].map(kit => (
              <Link key={kit.slug} to="/seasonal-kits" style={{ background: 'white', borderRadius: 20, padding: '24px 22px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--green-pale)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={18} color="var(--green-light)" />
                  </div>
                  <span style={{ background: 'var(--green)', color: 'var(--lime)', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, fontFamily: 'var(--font-mono)' }}>{kit.badge}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{kit.name}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>{kit.desc}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--green-light)', marginTop: 4 }}>View Kit <ArrowRight size={12} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="section" style={{ background: 'var(--cream-dark)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="tag tag-lime" style={{ marginBottom: 12 }}>Hand-picked</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em' }}>Featured Products</h2>
            </div>
            <Link to="/products?is_featured=true" className="btn btn-outline btn-sm" style={{ borderRadius: 100 }}>View All <ArrowRight size={14} /></Link>
          </div>
          {loading
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden' }}><Skeleton h={200} radius="0" /><div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={12} w="40%" /><Skeleton h={18} w="75%" /><Skeleton h={20} w="30%" /></div></div>)}
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
          }
        </div>
      </section>

      {/* ── New Arrivals ── */}
      {(loading || newArrivals.length > 0) && (
        <section className="section" style={{ background: 'var(--cream)' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ marginBottom: 12, background: 'var(--lime)', color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} /> Just Landed
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em' }}>New Arrivals</h2>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 8, maxWidth: 440 }}>Fresh additions to the Grove collection — be the first to discover them.</p>
              </div>
              <Link to="/products?ordering=-created_at" className="btn btn-outline btn-sm" style={{ borderRadius: 100 }}>View All New <ArrowRight size={14} /></Link>
            </div>

            {!loading && newArrivals.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                {newArrivals.slice(0, 2).map((p, i) => (
                  <Link key={p.id} to={`/products/${p.slug}`} className="animate-fade-up"
                    style={{ animationDelay: `${i * 0.1}s`, display: 'block', borderRadius: 24, overflow: 'hidden', position: 'relative', aspectRatio: '16/9', background: 'var(--green-pale)', boxShadow: 'var(--shadow)', textDecoration: 'none', transition: 'transform 0.4s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.015)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
                  >
                    {p.primary_image && <img src={imgUrl(p.primary_image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,44,28,0.78) 0%, rgba(20,44,28,0.12) 55%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 28px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--lime)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}><Sparkles size={10} /> New Arrival</span>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px,2vw,22px)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 10 }}>{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--lime)' }}>${Number(p.price).toFixed(2)}</span>
                        {p.compare_price && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'line-through' }}>${Number(p.compare_price).toFixed(2)}</span>}
                        <span style={{ marginLeft: 'auto', background: 'var(--lime)', color: 'var(--green)', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 100, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>Shop Now <ArrowRight size={11} /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {loading
              ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden' }}><Skeleton h={200} radius="0" /><div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={12} w="40%" /><Skeleton h={18} w="75%" /><Skeleton h={20} w="30%" /></div></div>)}
                </div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                  {newArrivals.slice(2).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
            }
          </div>
        </section>
      )}

      {/* ── Trust strip ── */}
      <section style={{ background: 'white', padding: '56px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 32 }}>
            {[
              { Icon: Truck, title: 'Free Shipping', desc: 'On all orders over $100' },
              { Icon: RotateCcw, title: 'Easy Returns', desc: '30-day no-hassle returns' },
              { Icon: Shield, title: 'Secure Payments', desc: 'SSL encrypted checkout' },
              { Icon: Star, title: 'Top Rated', desc: '4.9 average customer rating' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 48, height: 48, background: 'var(--green-pale)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} style={{ color: 'var(--green-light)' }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .hero-bg-stack{position:absolute;inset:0;z-index:0;}
        .hero-bg-slide{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transform:scale(1.04);transition:opacity 1s ease,transform 5s ease;}
        .hero-bg-slide.active{opacity:1;transform:scale(1);}
        .cat-card:hover{transform:translateY(-6px)!important;box-shadow:var(--shadow-lg)!important;}
        @media(max-width:700px){
          .cat-card-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>
    </div>
  );
}
