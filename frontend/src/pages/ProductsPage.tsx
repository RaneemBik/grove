import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { productApi } from '../api';
import ProductCard from '../components/products/ProductCard';
import ProductFilters from '../components/products/ProductFilters';
import { Skeleton, Pagination, Empty } from '../components/ui';
import type { Product } from '../types';

export default function ProductsPage() {
  const [sp] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(pg) };
      sp.forEach((v, k) => { params[k] = v; });
      const { data } = await productApi.list(params);
      setProducts(data.results);
      setCount(data.count);
      setPage(pg);
    } catch { setProducts([]); setCount(0); }
    finally { setLoading(false); }
  }, [sp.toString()]);

  useEffect(() => { load(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [sp.toString()]);

  const search = sp.get('search') || '';
  const cat = sp.get('category') || '';
  const title = search ? `"${search}"` : cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All Products';

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      {/* Page header */}
      <div style={{ background: 'var(--green)', padding: '48px 0 40px' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: 8 }}>{title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>
            {loading ? 'Loading…' : `${count} product${count !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <aside style={{ width: 256, flexShrink: 0, position: 'sticky', top: 90, display: 'none' }} className="sidebar-desktop">
            <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <ProductFilters />
            </div>
          </aside>

          {/* Main */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Mobile filter btn */}
            <div style={{ marginBottom: 20 }} className="mobile-filter-btn">
              <button onClick={() => setFiltersOpen(true)} className="btn btn-outline btn-sm" style={{ borderRadius: 100, gap: 6 }}>
                <SlidersHorizontal size={14} /> Filters & Sort
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden' }}>
                    <Skeleton h={200} radius="0" />
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Skeleton h={12} w="40%" /><Skeleton h={16} w="80%" /><Skeleton h={18} w="32%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <Empty icon={<Search size={52} />} title="No products found" desc="Try adjusting your filters or search term." />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
                  {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
                <Pagination page={page} total={count} onChange={pg => load(pg)} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,46,26,0.4)' }} onClick={() => setFiltersOpen(false)} />
          <div className="animate-fade-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '88vh', overflowY: 'auto', background: 'white', borderRadius: '24px 24px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Filters</span>
              <button onClick={() => setFiltersOpen(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <ProductFilters onClose={() => setFiltersOpen(false)} />
          </div>
        </div>
      )}

      <style>{`
        @media(min-width:900px){.sidebar-desktop{display:block!important;}.mobile-filter-btn{display:none!important;}}
      `}</style>
    </div>
  );
}
