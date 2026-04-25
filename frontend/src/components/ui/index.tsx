import React from 'react';
import { Loader2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../../utils';

export function Spinner({ size=20, cls='' }: { size?:number; cls?:string }) {
  return <Loader2 size={size} className={cx('animate-spin', cls)} style={{ color:'var(--green-light)' }} />;
}

export function Button({ variant='primary', size='md', loading, children, className, ...p }:
  { variant?:'primary'|'lime'|'outline'|'ghost'|'icon'; size?:'sm'|'md'|'lg'; loading?:boolean; children:React.ReactNode; className?:string; [k:string]:any }) {
  const sz = size==='sm'?'btn-sm':size==='lg'?'btn-lg':'';
  return (
    <button className={cx('btn', `btn-${variant}`, sz, className)} disabled={loading||p.disabled} {...p}>
      {loading && <Loader2 size={14} className="animate-spin" />}{children}
    </button>
  );
}

export const Input = React.forwardRef<HTMLInputElement, { label?:string; error?:string; hint?:string; [k:string]:any }>(
  ({ label, error, hint, className, ...p }, ref) => (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color:'var(--text-mid)', fontFamily:'var(--font-body)' }}>{label}</label>}
      <input ref={ref} className={cx('input', error&&'error', className)} {...p} />
      {error && <span style={{ fontSize:12, color:'#e53e3e' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize:12, color:'var(--text-muted)' }}>{hint}</span>}
    </div>
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, { label?:string; error?:string; rows?:number; [k:string]:any }>(
  ({ label, error, rows=4, className, ...p }, ref) => (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color:'var(--text-mid)' }}>{label}</label>}
      <textarea ref={ref} rows={rows} className={cx('input', error&&'error', className)} style={{ resize:'vertical' }} {...p} />
      {error && <span style={{ fontSize:12, color:'#e53e3e' }}>{error}</span>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

export function Stars({ rating, max=5, size=15 }: { rating:number; max?:number; size?:number }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {Array.from({ length:max }).map((_,i) => {
        const col = i+1 <= Math.floor(rating) ? '#c5e84a' : i+0.5<=rating ? '#c5e84a' : 'var(--sand)';
        return <Star key={i} size={size} fill={col} stroke={col} />;
      })}
    </div>
  );
}

export function Skeleton({ w, h, radius='var(--radius)' }: { w?:string|number; h?:string|number; radius?:string }) {
  return <div className="skeleton" style={{ width:w||'100%', height:h||16, borderRadius:radius }} />;
}

export function Empty({ icon, title, desc, action }: { icon?:React.ReactNode; title:string; desc?:string; action?:React.ReactNode }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px', textAlign:'center', gap:16 }}>
      {icon && <div style={{ color:'var(--sand)', marginBottom:8 }}>{icon}</div>}
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--text)' }}>{title}</h3>
      {desc && <p style={{ color:'var(--text-muted)', maxWidth:360, lineHeight:1.6 }}>{desc}</p>}
      {action}
    </div>
  );
}

export function Pagination({ page, total, perPage=12, onChange }: { page:number; total:number; perPage?:number; onChange:(p:number)=>void }) {
  const pages = Math.ceil(total/perPage);
  if (pages<=1) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'40px 0' }}>
      <button onClick={()=>onChange(page-1)} disabled={page===1} className="btn btn-outline btn-sm" style={{ borderRadius:100 }}><span style={{display:"flex",alignItems:"center",gap:4}}><ChevronLeft size={14}/> Prev</span></button>
      {Array.from({ length:Math.min(pages,7) }, (_,i)=>i+1).map(p=>(
        <button key={p} onClick={()=>onChange(p)} style={{ width:36, height:36, borderRadius:'50%', background:p===page?'var(--green)':'transparent', color:p===page?'white':'var(--text-mid)', border:p===page?'none':'1.5px solid var(--border)', fontFamily:'var(--font-mono)', fontSize:13, cursor:'pointer', transition:'var(--transition)' }}>{p}</button>
      ))}
      <button onClick={()=>onChange(page+1)} disabled={page===pages} className="btn btn-outline btn-sm" style={{ borderRadius:100 }}><span style={{display:"flex",alignItems:"center",gap:4}}>Next <ChevronRight size={14}/></span></button>
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxW='560px' }: { open:boolean; onClose:()=>void; title?:string; children:React.ReactNode; maxW?:string }) {
  React.useEffect(()=>{ document.body.style.overflow = open?'hidden':''; return()=>{ document.body.style.overflow=''; }; }, [open]);
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(26,46,26,0.55)', backdropFilter:'blur(6px)' }} />
      <div className="animate-scale-in card" style={{ position:'relative', width:'100%', maxWidth:maxW, boxShadow:'var(--shadow-xl)', zIndex:1 }} onClick={e=>e.stopPropagation()}>
        {title && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:18 }}>{title}</h3>
            <button onClick={onClose} className="btn-icon" style={{ borderRadius:'50%', fontSize:18 }}>✕</button>
          </div>
        )}
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}
