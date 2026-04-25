import { create } from 'zustand';
import { cartApi } from '../api';
import type { Cart } from '../types';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  open: boolean;
  fetch: () => Promise<void>;
  add: (id: number, qty?: number, variantSkuId?: number) => Promise<void>;
  update: (itemId: number, qty: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

export const useCart = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  open: false,
  fetch: async () => {
    set({ loading: true });
    try { const { data } = await cartApi.get(); set({ cart: data.cart }); }
    catch { set({ cart: null }); }
    finally { set({ loading: false }); }
  },
  // NOTE: Does NOT auto-open the drawer. Components show their own toast with a View Cart link.
  add: async (id, qty = 1, variantSkuId) => {
    const { data } = await cartApi.add(id, qty, variantSkuId);
    set({ cart: data.cart });
  },
  update: async (itemId, qty) => {
    const { data } = await cartApi.update(itemId, qty);
    set({ cart: data.cart });
  },
  remove: async (itemId) => {
    const { data } = await cartApi.remove(itemId);
    set({ cart: data.cart });
  },
  clear: async () => { await cartApi.clear(); set({ cart: null }); },
  setOpen: v => set({ open: v }),
  toggle: () => set(s => ({ open: !s.open })),
}));
