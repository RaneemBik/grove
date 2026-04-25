import React from 'react';
import toast from 'react-hot-toast';
import { ShoppingBag } from 'lucide-react';

/**
 * Show an "Added to cart" toast that includes a "View Cart" button.
 * Import this instead of calling toast.success('Added to cart') directly.
 */
export function showAddedToCartToast(productName: string) {
  toast.custom((t) => (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--green)', color: 'white',
        padding: '12px 16px', borderRadius: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        fontFamily: 'var(--font-body)', fontSize: 14,
        opacity: t.visible ? 1 : 0,
        transition: 'opacity 0.3s',
        maxWidth: 340,
      }}
    >
      <ShoppingBag size={16} style={{ flexShrink: 0, color: '#c5e84a' }} />
      <span style={{ flex: 1, fontWeight: 500 }}>
        <strong>{productName}</strong> added to cart
      </span>
      <a
        href="/cart"
        onClick={() => toast.dismiss(t.id)}
        style={{
          background: '#c5e84a', color: 'var(--green)',
          borderRadius: 100, padding: '5px 14px',
          fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          textDecoration: 'none', flexShrink: 0,
        }}
      >
        View Cart
      </a>
    </div>
  ), { duration: 4000 });
}
