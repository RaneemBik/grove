import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { productApi } from '../../api';
import type { Category } from '../../types';

export default function ProductFilters({ onClose }: { onClose?: () => void }) {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({ sort: true, cat: true, price: true, avail: true });

  const [category, setCategory] = useState(sp.get('category') || '');
  const [minP, setMinP] = useState(sp.get('min_price') || '');
  const [maxP, setMaxP] = useState(sp.get('max_price') || '');
  const [inStock, setInStock] = useState(sp.get('in_stock') === 'true');
  const [ordering, setOrdering] = useState(sp.get('ordering') || '-created_at');

  useEffect(() => {
    productApi.categories()
      .then(r => {
        const data = r.data;
        const list = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        setCats(list);
      })
      .catch(() => { setCats([]); });
  }, []);

  const apply = () => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (minP) p.set('min_price', minP);
    if (maxP) p.set('max_price', maxP);
    if (inStock) p.set('in_stock', 'true');
    if (ordering !== '-created_at') p.set('ordering', ordering);
    const s = sp.get('search');
    if (s) p.set('search', s);
    nav(`/products?${p.toString()}`);
    onClose?.();
  };

  const reset = () => {
    setCategory(''); setMinP(''); setMaxP(''); setInStock(false); setOrdering('-created_at');
    nav('/products');
    onClose?.();
  };

  const tog = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }));
  const active = [category, minP || maxP, inStock].filter(Boolean).length;

  const Section = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
      <button onClick={() => tog(id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginBottom: open[id] ? 12 : 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        {open[id] ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open[id] && children}
    </div>
  );

  const RadioOpt = ({ name, value, checked, label, sub }: any) => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '5px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="radio" name={name} value={value} checked={checked} onChange={() => {}} style={{ accentColor: 'var(--green-light)', width: 14, height: 14 }} />
        <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{label}</span>
      </div>
      {sub && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{sub}</span>}
    </label>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={15} style={{ color: 'var(--green-light)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Filters</span>
          {active > 0 && <span className="chip chip-lime">{active}</span>}
        </div>
        {active > 0 && (
          <button onClick={reset} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear all</button>
        )}
      </div>

      {/* Sort */}
      <Section id="sort" label="Sort By">
        {[
          { value: '-created_at', label: 'Newest First' },
          { value: 'price', label: 'Price: Low to High' },
          { value: '-price', label: 'Price: High to Low' },
          { value: 'name', label: 'Name A–Z' },
        ].map(o => (
          <div key={o.value} onClick={() => setOrdering(o.value)}>
            <RadioOpt name="ordering" value={o.value} checked={ordering === o.value} label={o.label} />
          </div>
        ))}
      </Section>

      {/* Category */}
      <Section id="cat" label="Category">
        <div onClick={() => setCategory('')}><RadioOpt name="cat" value="" checked={!category} label="All Categories" /></div>
        {cats.map(c => (
          <div key={c.id} onClick={() => setCategory(c.slug)}>
            <RadioOpt name="cat" value={c.slug} checked={category === c.slug} label={c.name} sub={c.product_count} />
          </div>
        ))}
      </Section>

      {/* Price */}
      <Section id="price" label="Price Range">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input type="number" placeholder="Min $" value={minP} onChange={e => setMinP(e.target.value)} className="input" style={{ padding: '8px 10px', fontSize: 13 }} />
          <input type="number" placeholder="Max $" value={maxP} onChange={e => setMaxP(e.target.value)} className="input" style={{ padding: '8px 10px', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[['0', '25'], ['25', '50'], ['50', '100'], ['100', '200']].map(([mn, mx]) => (
            <button key={`${mn}-${mx}`} onClick={() => { setMinP(mn); setMaxP(mx); }}
              style={{ fontSize: 12, fontFamily: 'var(--font-mono)', padding: '4px 10px', borderRadius: 100, cursor: 'pointer', border: '1.5px solid var(--border)', background: minP === mn && maxP === mx ? 'var(--green-pale)' : 'white', color: minP === mn && maxP === mx ? 'var(--green-mid)' : 'var(--text-mid)' }}>
              ${mn}–${mx}
            </button>
          ))}
        </div>
      </Section>

      {/* Availability */}
      <Section id="avail" label="Availability">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} style={{ accentColor: 'var(--green-light)', width: 15, height: 15 }} />
          <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>In stock only</span>
        </label>
      </Section>

      <button onClick={apply} className="btn btn-primary" style={{ width: '100%', borderRadius: 12 }}>Apply Filters</button>
    </div>
  );
}
