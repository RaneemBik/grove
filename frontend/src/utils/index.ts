export const fmt = (n: string | number) => `$${parseFloat(String(n)).toFixed(2)}`;
export const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
export const imgUrl = (u?: string | null) => {
  if (!u) return '/placeholder.svg';
  if (u.startsWith('http')) return u;
  return `${import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000'}${u}`;
};
export const cx = (...c: (string|boolean|undefined|null)[]) => c.filter(Boolean).join(' ');
export const getErr = (e: any): string => {
  const d = e?.response?.data;
  if (d?.message) return d.message;
  if (d?.detail) return d.detail;
  if (d?.errors) return Object.values(d.errors).flat().join(', ') as string;
  return e?.message || 'Something went wrong';
};
export const STATUS_LABEL: Record<string, string> = {
  pending:'Pending', paid:'Paid', processing:'Processing',
  shipped:'Shipped', delivered:'Delivered', cancelled:'Cancelled', refunded:'Refunded',
};
export const STATUS_CHIP: Record<string, string> = {
  pending:'chip-amber', paid:'chip-lime', processing:'chip-lime',
  shipped:'chip-green', delivered:'chip-green', cancelled:'chip-gray', refunded:'chip-gray',
};
