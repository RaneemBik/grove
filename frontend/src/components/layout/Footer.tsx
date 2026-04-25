import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

export default function Footer() {
  const nav = useNavigate();
  const { isAuthenticated, user, fetchProfile } = useAuth();
  const [subLoading, setSubLoading] = useState(false);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!isAuthenticated) {
      nav('/auth/login?next=/');
      return;
    }
    setSubLoading(true);
    try {
      const { data } = await authApi.subscribe(plan);
      await fetchProfile();
      toast.success(data?.message || 'Subscription activated.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not subscribe right now.');
    } finally {
      setSubLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!isAuthenticated) {
      nav('/auth/login?next=/');
      return;
    }
    setSubLoading(true);
    try {
      const { data } = await authApi.cancelSubscription();
      await fetchProfile();
      toast.success(data?.message || 'Subscription cancelled.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not cancel subscription.');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <footer>
      {/* Newsletter */}
      <div style={{ background:'var(--green)', padding:'64px 0' }}>
        <div className="container" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24, textAlign:'center' }}>
          <span className="tag tag-lime">Stay in the Loop</span>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,4vw,44px)', color:'white', fontWeight:800, maxWidth:480, lineHeight:1.2 }}>
            Join our growing community
          </h2>
          {user?.is_subscriber ? (
            <>
              <p style={{ color:'rgba(255,255,255,0.72)', fontSize:15, maxWidth:460 }}>
                You are subscribed on the {user.subscription_plan} plan. You can cancel anytime.
              </p>
              <button onClick={handleCancel} disabled={subLoading} className="btn btn-lime" style={{ minWidth: 220 }}>
                {subLoading ? 'Please wait…' : 'Cancel Subscription'}
              </button>
            </>
          ) : (
            <>
              <p style={{ color:'rgba(255,255,255,0.65)', fontSize:15, maxWidth:440 }}>Subscribe for exclusive deals, new arrivals and curated picks.</p>
              {!isAuthenticated ? (
                <button onClick={() => nav('/auth/login?next=/')} className="btn btn-lime" style={{ minWidth: 220 }}>Login to Subscribe</button>
              ) : (
                <div className="footer-subscribe-actions" style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
                  <button onClick={() => handleSubscribe('monthly')} disabled={subLoading} className="btn btn-lime">
                    {subLoading ? 'Please wait…' : 'Subscribe Monthly'}
                  </button>
                  <button onClick={() => handleSubscribe('yearly')} disabled={subLoading} className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}>
                    Subscribe Yearly
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ background:'var(--green)', borderTop:'1px solid rgba(255,255,255,0.1)', padding:'64px 0 40px' }}>
        <div className="container">
          <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:48, marginBottom:48 }}>
            {/* Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ width:36, height:36, background:'var(--lime)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--green)' }}>G</span>
                </div>
                <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'white' }}>Grove</span>
              </div>
              <p style={{ color:'rgba(255,255,255,0.55)', fontSize:14, lineHeight:1.7, maxWidth:220 }}>Curated goods for a life well-lived. Quality meets thoughtful design.</p>
            </div>

            {/* Shop */}
            <div>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.1em', color:'var(--lime)', textTransform:'uppercase', marginBottom:16 }}>Shop</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['All Products','/products'],['Electronics','/products?category=electronics'],['Clothing','/products?category=clothing'],['Books','/products?category=books'],['Featured','/products?is_featured=true']].map(([l,h])=>(
                  <Link key={l} to={h} style={{ fontSize:14, color:'rgba(255,255,255,0.6)', transition:'color 0.2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.color='white')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>{l}</Link>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.1em', color:'var(--lime)', textTransform:'uppercase', marginBottom:16 }}>Account</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['My Profile','/account'],['Orders','/account/orders'],['Addresses','/account/addresses'],['Sign In','/auth/login'],['Register','/auth/register']].map(([l,h])=>(
                  <Link key={l} to={h} style={{ fontSize:14, color:'rgba(255,255,255,0.6)', transition:'color 0.2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.color='white')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>{l}</Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.1em', color:'var(--lime)', textTransform:'uppercase', marginBottom:16 }}>Contact</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[{ Icon:MapPin, t:'123 Grove St, Lebanon, Saida Street 03' },{ Icon:Phone, t:'+961 70 000 000' },{ Icon:Mail, t:'raneembikai70@gmail.com' }].map(({ Icon, t })=>(
                  <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <Icon size={14} style={{ color:'var(--lime)', flexShrink:0, marginTop:2 }} />
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:24, display:'flex', flexWrap:'wrap', gap:16, alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.35)', letterSpacing:'0.06em' }}>© {new Date().getFullYear()} GROVE. ALL RIGHTS RESERVED.</p>
            <div style={{ display:'flex', gap:24 }}>
              {['Privacy','Terms','Shipping'].map(l=>(
                <Link key={l} to="#" style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(255,255,255,0.35)', letterSpacing:'0.06em', transition:'color 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.35)')}>{l.toUpperCase()}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:640px){
          .footer-newsletter{flex-direction:column;}
          .footer-newsletter .btn{width:100%;}
          .footer-subscribe-actions{flex-direction:column;width:100%;}
          .footer-subscribe-actions .btn{width:100%;}
          .footer-grid{gap:28px!important;}
        }
      `}</style>
    </footer>
  );
}
