import { useState, useEffect, useCallback } from 'react';

export interface GiftBoxFee {
  name: string;
  price: string;
  orderId: number;
}

export function useGiftBoxFees() {
  const [fees, setFees] = useState<GiftBoxFee[]>([]);

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem('grove_gift_box_fees');
      setFees(raw ? JSON.parse(raw) : []);
    } catch {
      setFees([]);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [load]);

  const removeFee = useCallback((orderId: number) => {
    try {
      const raw = localStorage.getItem('grove_gift_box_fees');
      const current: GiftBoxFee[] = raw ? JSON.parse(raw) : [];
      const updated = current.filter(f => f.orderId !== orderId);
      localStorage.setItem('grove_gift_box_fees', JSON.stringify(updated));
      setFees(updated);
    } catch {
      setFees([]);
    }
  }, []);

  const clearFees = useCallback(() => {
    localStorage.removeItem('grove_gift_box_fees');
    setFees([]);
  }, []);

  const totalFees = fees.reduce((sum, f) => sum + parseFloat(f.price || '0'), 0);

  return { fees, totalFees, removeFee, clearFees, reload: load };
}
