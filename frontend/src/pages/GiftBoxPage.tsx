import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, Minus, Trash2, ShoppingBag, Package, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { giftBoxApi, productApi, cartApi } from '../api';
import { useAuth } from '../store/authStore';
import { useCart } from '../store/cartStore';
import { fmt, imgUrl } from '../utils';
import { Spinner, Button } from '../components/ui';
import type { GiftBox, GiftBoxOrder, Product } from '../types';
import toast from 'react-hot-toast';

type Step = 'boxes' | 'products' | 'review';

export default function GiftBoxPage() {
  const [boxes, setBoxes] = useState<GiftBox[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [selectedBox, setSelectedBox] = useState<GiftBox | null>(null);
  const [activeOrder, setActiveOrder] = useState<GiftBoxOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [step, setStep] = useState<Step>('boxes');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { isAuthenticated } = useAuth();
  const { fetch: fetchCart } = useCart();
  const nav = useNavigate();

  useEffect(() => {
    giftBoxApi.list().then(r => setBoxes(r.data)).catch(() => {}).finally(() => setLoadingBoxes(false));
  }, []);

  const handleSelectBox = async (box: GiftBox) => {
    if (!isAuthenticated) { nav('/auth/login'); return; }
    setSelectedBox(box);
    setCreatingOrder(true);
    try {
      const { data } = await giftBoxApi.createOrder(box.id);
      setActiveOrder(data);
      setStep('products');
      loadProducts();
    } catch (e: any) {
      toast.error('Could not open gift box. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const loadProducts = () => {
    setLoadingProducts(true);
    productApi.list({ page_size: 100 })
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.results || []);
        setProducts(list.filter((p: Product) => p.is_in_stock));
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  };

  const handleAddProduct = async (product: Product) => {
    if (!activeOrder) return;
    const itemCount = activeOrder.items.length;
    if (itemCount >= activeOrder.gift_box.max_items) {
      toast.error(`This box holds max ${activeOrder.gift_box.max_items} items.`);
      return;
    }
    try {
      const { data } = await giftBoxApi.addItem(activeOrder.id, product.id);
      setActiveOrder(data);
      toast.success(`${product.name} added to box!`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Could not add product');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!activeOrder) return;
    try {
      const { data } = await giftBoxApi.removeItem(activeOrder.id, itemId);
      setActiveOrder(data);
    } catch {
      toast.error('Could not remove item');
    }
  };

  const isProductInBox = (productId: number) =>
    activeOrder?.items.some(i => i.product.id === productId) ?? false;

  const handleAddAllToCart = async () => {
    if (!activeOrder || activeOrder.items.length === 0) {
      toast.error('Add at least one product to your box first.');
      return;
    }
    setAddingToCart(true);
    try {
      // Add each product in the box to cart normally
      for (const item of activeOrder.items) {
        await cartApi.add(item.product.id, item.quantity);
      }

      // Store the box fee in localStorage so CartPage/CheckoutPage can display + charge it
      const existingFees: Array<{name: string; price: string; orderId: number}> = JSON.parse(localStorage.getItem('grove_gift_box_fees') || '[]');
      // Remove any previous fee for this same order (avoid duplicates)
      const filtered = existingFees.filter(f => f.orderId !== activeOrder.id);
      filtered.push({
        name: activeOrder.gift_box.name,
        price: String(activeOrder.gift_box.price),
        orderId: activeOrder.id,
      });
      localStorage.setItem('grove_gift_box_fees', JSON.stringify(filtered));
      await fetchCart();
      toast.success(`Gift box contents added to cart!`);
      // Reset state
      setStep('boxes');
      setActiveOrder(null);
      setSelectedBox(null);
    } catch (e: any) {
      toast.error('Could not add all items to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBack = () => {
    if (step === 'products') setStep('boxes');
    else if (step === 'review') setStep('products');
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh', paddingBottom: 80 }}>
      {/* Hero banner */}
      <div style={{ background: 'var(--green)', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gift size={32} color="var(--lime)" />
          </div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>
          Build Your Gift Box
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
          Choose a box, fill it with your favourite Grove products, and check out as one beautiful gift.
        </p>
      </div>

      {/* Step indicator */}
      {step !== 'boxes' && (
        <div style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleBack} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={14} /> Back
            </button>
            <ChevronRight size={13} color="var(--text-muted)" />
            {selectedBox && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{selectedBox.name}</span>}
            <ChevronRight size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>
              {step === 'products' ? 'Add Products' : 'Review Box'}
            </span>
            {activeOrder && (
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: 'var(--text-mid)' }}>
                {activeOrder.items.length} / {activeOrder.gift_box.max_items} items
              </span>
            )}
          </div>
        </div>
      )}

      <div className="container" style={{ padding: '48px 24px 0' }}>

        {/* ── STEP 1: Choose a box ── */}
        {step === 'boxes' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--green)', marginBottom: 8 }}>
                Choose Your Box
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
                Each box is a flat fee — fill it with any products you love.
              </p>
            </div>

            {loadingBoxes ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>
            ) : boxes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                <Package size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                <p>No gift boxes available yet. Check back soon!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%),1fr))', gap: 24 }}>
                {boxes.map(box => (
                  <div key={box.id} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    className="gift-box-card"
                  >
                    {/* Box image */}
                    <div style={{ aspectRatio: '4/3', background: 'var(--green-mist)', position: 'relative', overflow: 'hidden' }}>
                      {box.image_url ? (
                        <img src={box.image_url} alt={box.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Gift size={64} color="var(--green-light)" />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 14, right: 14, background: 'var(--green)', color: 'white', borderRadius: 100, padding: '4px 14px', fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {fmt(box.price)}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '20px 20px 24px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--green)', marginBottom: 8 }}>{box.name}</h3>
                      <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 12 }}>{box.description}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                        Up to <strong>{box.max_items} products</strong> for one flat price
                      </p>
                      <Button
                        onClick={() => handleSelectBox(box)}
                        loading={creatingOrder && selectedBox?.id === box.id}
                        style={{ width: '100%', borderRadius: 100, background: 'var(--green)', color: 'white', padding: '12px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <Gift size={16} /> Build This Box
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Add Products ── */}
        {step === 'products' && activeOrder && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 32, alignItems: 'start' }} className="gb-layout">
            {/* Products grid */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--green)', marginBottom: 24 }}>
                Add Products to Your Box
              </h2>
              {loadingProducts ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px,100%),1fr))', gap: 16 }}>
                  {products.map(product => {
                    const inBox = isProductInBox(product.id);
                    return (
                      <div key={product.id} style={{
                        background: 'white', borderRadius: 16, overflow: 'hidden',
                        border: `2px solid ${inBox ? 'var(--green-light)' : 'var(--border)'}`,
                        transition: 'all 0.2s', position: 'relative',
                      }}>
                        {inBox && (
                          <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--green)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>
                          </div>
                        )}
                        <div style={{ aspectRatio: '1', background: 'var(--green-mist)', overflow: 'hidden' }}>
                          <img
                            src={imgUrl(product.primary_image)}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        </div>
                        <div style={{ padding: '12px 12px 14px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                          <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>{fmt(product.price)}</p>
                          <button
                            onClick={() => inBox
                              ? handleRemoveItem(activeOrder.items.find(i => i.product.id === product.id)!.id)
                              : handleAddProduct(product)
                            }
                            style={{
                              width: '100%', borderRadius: 100, padding: '8px 0', fontSize: 13,
                              fontWeight: 600, border: 'none', cursor: 'pointer',
                              background: inBox ? 'var(--green-mist)' : 'var(--green)',
                              color: inBox ? 'var(--green)' : 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                          >
                            {inBox ? (<><X size={12} /> Remove</>) : (<><Plus size={12} /> Add</>)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar: current box contents */}
            <div style={{ position: 'sticky', top: 90 }}>
              <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                <div style={{ background: 'var(--green)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Gift size={20} color="var(--lime)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: 16 }}>
                    {activeOrder.gift_box.name}
                  </span>
                  <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 100, padding: '2px 10px', fontSize: 12, color: 'white', fontWeight: 600 }}>
                    {activeOrder.items.length}/{activeOrder.gift_box.max_items}
                  </span>
                </div>

                <div style={{ padding: 16 }}>
                  {activeOrder.items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                      <Package size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                      <p style={{ fontSize: 13 }}>Your box is empty.<br />Add products from the left.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      {activeOrder.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 12, background: 'var(--cream)' }}>
                          <img
                            src={imgUrl(item.product.primary_image)}
                            alt={item.product.name}
                            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmt(item.product.price)}</p>
                          </div>
                          <button onClick={() => handleRemoveItem(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Box price summary */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Box price</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(activeOrder.gift_box.price)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>
                      <span>You pay</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(activeOrder.gift_box.price)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      Products inside are wrapped as one gift — you only pay the box fee at checkout.
                    </p>
                  </div>

                  <Button
                    onClick={handleAddAllToCart}
                    loading={addingToCart}
                    disabled={activeOrder.items.length === 0}
                    style={{
                      width: '100%', borderRadius: 100, background: 'var(--green)', color: 'white',
                      padding: '13px 0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: activeOrder.items.length === 0 ? 0.5 : 1,
                    }}
                  >
                    <ShoppingBag size={16} /> Add Box to Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .gift-box-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg) !important; }
        @media(max-width:900px){
          .gb-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
