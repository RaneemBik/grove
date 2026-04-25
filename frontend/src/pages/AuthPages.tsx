import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../store/authStore';
import { authApi } from '../api';
import { Input, Button } from '../components/ui';
import toast from 'react-hot-toast';

const AuthShell = ({ title, sub, children, footer }: { title: string; sub: string; children: React.ReactNode; footer: React.ReactNode }) => (
  <div style={{ minHeight: '80vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', padding: '48px 24px' }}>
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--lime)' }}>G</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>Grove</span>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em', marginBottom: 8 }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{sub}</p>
      </div>
      <div className="auth-card" style={{ background: 'white', borderRadius: 24, padding: 36, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        {children}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>{footer}</div>
      </div>
    </div>
    <style>{`
      @media(max-width:640px){
        .auth-card{padding:22px!important;border-radius:18px!important;}
      }
    `}</style>
  </div>
);

// ── Login ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
type LF = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next') || '/account';
  const { register, handleSubmit, formState: { errors } } = useForm<LF>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (d: LF) => {
    try { await login(d.email, d.password); toast.success('Welcome back! 👋'); nav(next); }
    catch (e: any) { toast.error(e?.response?.data?.detail || 'Invalid credentials'); }
  };

  return (
    <AuthShell title="Welcome back" sub="Sign in to your Grove account"
      footer={<p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No account? <Link to="/auth/register" style={{ color: 'var(--green-light)', fontWeight: 700 }}>Create one</Link></p>}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
        <div style={{ position: 'relative' }}>
          <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="••••••••" {...register('password')} error={errors.password?.message} />
          <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: 34, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div style={{ textAlign: 'right', marginTop: -8 }}>
          <Link to="/auth/forgot-password" style={{ fontSize: 13, color: 'var(--green-light)' }}>Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} style={{ width: '100%', borderRadius: 12, padding: '14px 0', gap: 8, justifyContent: 'center', background: 'var(--green)', color: 'white', fontSize: 15 }}>
          Sign In <ArrowRight size={15} />
        </Button>
      </form>
    </AuthShell>
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
const regSchema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1),
  username: z.string().min(3), email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8), password2: z.string(),
}).refine(d => d.password === d.password2, { message: 'Passwords must match', path: ['password2'] });
type RF = z.infer<typeof regSchema>;

export function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const nav = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RF>({ resolver: zodResolver(regSchema) });
  const pw = watch('password', '');

  const onSubmit = async (d: RF) => {
    try { await registerUser(d); toast.success('Account created! Welcome to Grove'); nav('/account'); }
    catch (e: any) {
      const payload = e?.response?.data;
      const nestedErrors = payload?.errors;

      if (nestedErrors && typeof nestedErrors === 'object') {
        Object.values(nestedErrors).flat().forEach((m: any) => toast.error(String(m)));
        return;
      }

      // DRF serializer errors are often returned as field -> [messages].
      if (payload && typeof payload === 'object') {
        const fieldMessages = Object.entries(payload)
          .filter(([k]) => k !== 'message' && k !== 'detail' && k !== 'success')
          .flatMap(([, v]) => Array.isArray(v) ? v : [v])
          .filter(Boolean)
          .map((m) => String(m));

        if (fieldMessages.length > 0) {
          fieldMessages.forEach((m) => toast.error(m));
          return;
        }
      }

      toast.error(payload?.message || payload?.detail || 'Registration failed');
    }
  };

  const reqs = [{ l: '8+ chars', ok: pw.length >= 8 }, { l: 'Uppercase', ok: /[A-Z]/.test(pw) }, { l: 'Number', ok: /\d/.test(pw) }];

  return (
    <AuthShell title="Create account" sub="Join thousands of Grove customers"
      footer={<p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Already have one? <Link to="/auth/login" style={{ color: 'var(--green-light)', fontWeight: 700 }}>Sign in</Link></p>}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="auth-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
          <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
          <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
        </div>
        <Input label="Username" {...register('username')} error={errors.username?.message} />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Phone (optional)" type="tel" {...register('phone')} />
        <div style={{ position: 'relative' }}>
          <Input label="Password" type={showPw ? 'text' : 'password'} {...register('password')} error={errors.password?.message} />
          <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: 34, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {pw && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: -8 }}>
            {reqs.map(r => (
              <span key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: r.ok ? 'var(--green-light)' : 'var(--text-muted)' }}>
                <CheckCircle size={11} /> {r.l}
              </span>
            ))}
          </div>
        )}
        <Input label="Confirm Password" type="password" {...register('password2')} error={errors.password2?.message} />
        <Button type="submit" loading={loading} style={{ width: '100%', borderRadius: 12, padding: '14px 0', gap: 8, justifyContent: 'center', background: 'var(--green)', color: 'white', fontSize: 15 }}>
          Create Account <ArrowRight size={15} />
        </Button>
      </form>
      <style>{`@media(max-width:640px){.auth-two-col{grid-template-columns:1fr!important;}}`}</style>
    </AuthShell>
  );
}

const forgotSchema = z.object({ email: z.string().email() });
type ForgotF = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotF>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (d: ForgotF) => {
    try {
      await authApi.requestPasswordReset(d.email);
      toast.success('If the email exists, a reset link was sent.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not request password reset');
    }
  };

  return (
    <AuthShell title="Reset password" sub="Enter your email to receive a reset link"
      footer={<p style={{ fontSize: 14, color: 'var(--text-muted)' }}><Link to="/auth/login" style={{ color: 'var(--green-light)', fontWeight: 700 }}>Back to sign in</Link></p>}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Button type="submit" loading={isSubmitting} style={{ width: '100%', borderRadius: 12, padding: '14px 0', justifyContent: 'center' }}>
          Send Reset Link
        </Button>
      </form>
    </AuthShell>
  );
}

const resetSchema = z.object({
  new_password: z.string().min(8),
  new_password2: z.string().min(8),
}).refine(d => d.new_password === d.new_password2, { message: 'Passwords must match', path: ['new_password2'] });
type ResetF = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const uid = sp.get('uid') || '';
  const token = sp.get('token') || '';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetF>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (d: ResetF) => {
    if (!uid || !token) {
      toast.error('Invalid reset link');
      return;
    }
    try {
      await authApi.confirmPasswordReset({ uid, token, new_password: d.new_password, new_password2: d.new_password2 });
      toast.success('Password reset successful. Please login.');
      nav('/auth/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not reset password');
    }
  };

  return (
    <AuthShell title="Set new password" sub="Choose a secure new password"
      footer={<p style={{ fontSize: 14, color: 'var(--text-muted)' }}><Link to="/auth/login" style={{ color: 'var(--green-light)', fontWeight: 700 }}>Back to sign in</Link></p>}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="New Password" type="password" {...register('new_password')} error={errors.new_password?.message} />
        <Input label="Confirm New Password" type="password" {...register('new_password2')} error={errors.new_password2?.message} />
        <Button type="submit" loading={isSubmitting} style={{ width: '100%', borderRadius: 12, padding: '14px 0', justifyContent: 'center' }}>
          Update Password
        </Button>
      </form>
    </AuthShell>
  );
}
