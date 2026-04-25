import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../store/cartStore';
import { useAuth } from '../../store/authStore';
import { fmt, imgUrl } from '../../utils';
import { Spinner } from '../ui';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const { cart, loading, open, setOpen, update, remove } = useCart();
  const { isAuthenticated } = useAuth();

  const handleUpdate = async (id: number, qty: number) => {
    try { await update(id, qty); } catch (e: any) { toast.error(e?.response?.data?.message||'Error'); }
  };
  const handleRemove = async (id: number) => {
    try { await remove(id); toast.success('Removed'); } catch { toast.error('Error'); }
  };

  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50 }}>
      <div className="animate-fade-in" style={{ position:'absolute', inset:0, background:'rgba(26,46,26,0.5)', backdropFilter:'blur(4px)' }} onClick={()=>setOpen(false)} />
      <div className="animate-slide-right" style={{ position:'absolute', top:0, right:0, bottom:0, width:'100%', maxWidth:420, background:'var(--cream)', boxShadow:'var(--shadow-xl)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ShoppingBag size={18} style={{ color:'var(--green-light)' }} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700 }}>Your Cart</span>
            {cart && cart.total_items > 0 && <span className="chip chip-green">{cart.total_items}</span>}
          </div>
          <button onClick={()=>setOpen(false)} className="btn-icon" style={{ borderRadius:'50%' }}><X size={18}/></button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:64 }}><Spinner size={36}/></div>
          ) : !isAuthenticated ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 24px', gap:16, textAlign:'center' }}>
              <ShoppingBag size={52} style={{ color:'var(--sand)' }}/>
              <p style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--text)' }}>Sign in to view cart</p>
              <Link to="/auth/login" onClick={()=>setOpen(false)} className="btn btn-primary btn-sm">Sign In</Link>
            </div>
          ) : !cart || cart.items.length===0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 24px', gap:16, textAlign:'center' }}>
              <ShoppingBag size={52} style={{ color:'var(--sand)' }}/>
              <p style={{ fontFamily:'var(--font-display)', fontSize:18 }}>Your cart is empty</p>
              <p style={{ color:'var(--text-muted)', fontSize:14 }}>Explore our collection</p>
              <Link to="/products" onClick={()=>setOpen(false)} className="btn btn-primary btn-sm">Shop Now</Link>
            </div>
          ) : (
            <div>
              {cart.items.map(item=>(
                <div key={item.id} style={{ display:'flex', gap:14, padding:'16px 24px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:76, height:76, borderRadius:12, overflow:'hidden', background:'var(--green-mist)', flexShrink:0, position:'relative' }}>
                    <img src={imgUrl(item.product.primary_image)} alt={item.product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <Link to={`/products/${item.product.slug}`} onClick={()=>setOpen(false)} style={{ fontSize:14, fontWeight:600, color:'var(--text)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.4 }}>
                      {item.product.name}
                    </Link>
                    <p style={{ fontSize:13, color:'var(--green-light)', fontWeight:700, marginTop:4 }}>{fmt(item.unit_price)}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, border:'1.5px solid var(--border)', borderRadius:100, padding:'3px 10px' }}>
                        <button onClick={()=>item.quantity>1?handleUpdate(item.id,item.quantity-1):handleRemove(item.id)} className="btn-icon" style={{ width:22, height:22, padding:0 }}><Minus size={11}/></button>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:13, minWidth:20, textAlign:'center', fontWeight:700 }}>{item.quantity}</span>
                        <button onClick={()=>handleUpdate(item.id,item.quantity+1)} className="btn-icon" style={{ width:22, height:22, padding:0 }}><Plus size={11}/></button>
                      </div>
                      <button onClick={()=>handleRemove(item.id)} className="btn-icon" style={{ color:'var(--text-muted)' }}><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, flexShrink:0 }}>{fmt(item.line_total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length>0 && (
          <div style={{ borderTop:'1px solid var(--border)', padding:24, background:'white', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:14, color:'var(--text-mid)' }}>Subtotal</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700 }}>{fmt(cart.subtotal)}</span>
            </div>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>Shipping & tax calculated at checkout</p>
            <Link to="/checkout" onClick={()=>setOpen(false)} className="btn btn-primary" style={{ width:'100%', borderRadius:12, justifyContent:'space-between' }}>
              <span>Checkout</span><ArrowRight size={16}/>
            </Link>
            <Link to="/cart" onClick={()=>setOpen(false)} className="btn btn-outline" style={{ width:'100%', borderRadius:12 }}>View Cart</Link>
          </div>
        )}
      </div>
    </div>
  );
}
