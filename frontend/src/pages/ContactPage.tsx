import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { contactApi } from '../api';
import { Input, Textarea, Button } from '../components/ui';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Invalid email'),
  subject: z.string().min(3, 'Please enter a subject'),
  message: z.string().min(10, 'Message too short'),
});
type F = z.infer<typeof schema>;

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: F) => {
    try { await contactApi.send(d); setSent(true); reset(); toast.success('Message sent!'); }
    catch { toast.error('Could not send. Please try again.'); }
  };

  const info = [
    { Icon: MapPin, l: 'Address', v: '123 Grove St, Lebanon, Saida Street 03' },
    { Icon: Phone, l: 'Phone', v: '+961 70 000 000' },
    { Icon: Mail, l: 'Email', v: 'raneembikai70@gmail.com' },
  ];

  return (
    <div style={{ background: 'var(--cream)' }}>
      {/* Hero */}
      <div style={{ background: 'var(--green)', padding: '72px 0 56px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="tag tag-lime" style={{ marginBottom: 16 }}>Get in Touch</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, color: 'white', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16 }}>
            We'd love to hear<br />from you
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Have a question, feedback, or just want to say hello? Our team is here and ready to help.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '64px 24px 96px' }}>
        <div className="contact-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 40, alignItems: 'start' }}>
          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {info.map(({ Icon, l, v }) => (
              <div key={l} style={{ background: 'white', borderRadius: 20, padding: 22, display: 'flex', alignItems: 'flex-start', gap: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ width: 46, height: 46, background: 'var(--green-pale)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} style={{ color: 'var(--green-light)' }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{l}</p>
                  <p style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, lineHeight: 1.5 }}>{v}</p>
                </div>
              </div>
            ))}
            <div style={{ background: 'white', borderRadius: 20, padding: 22, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 12 }}>Business Hours</h3>
              <div style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 2.1 }}>
                {[['Mon – Fri', '9am – 6pm EST'], ['Saturday', '10am – 4pm EST'], ['Sunday', 'Closed']].map(([d, h]) => (
                  <div key={d} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{d}</span>
                    <span style={{ fontWeight: 600, color: h === 'Closed' ? 'var(--text-muted)' : 'var(--text)' }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ background: 'white', borderRadius: 24, padding: 36, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            {sent ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 16, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, background: 'var(--green-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={36} style={{ color: 'var(--green-light)' }} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>Message Sent!</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: 320 }}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} className="btn btn-primary btn-sm" style={{ borderRadius: 100 }}>Send Another</button>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--green)', marginBottom: 24 }}>Send a Message</h2>
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="contact-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16 }}>
                    <Input label="Your Name" placeholder="Jane Smith" {...register('name')} error={errors.name?.message} />
                    <Input label="Email Address" type="email" placeholder="jane@example.com" {...register('email')} error={errors.email?.message} />
                  </div>
                  <Input label="Subject" placeholder="How can we help?" {...register('subject')} error={errors.subject?.message} />
                  <Textarea label="Message" placeholder="Tell us more…" rows={6} {...register('message')} error={errors.message?.message} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" loading={isSubmitting} style={{ borderRadius: 100, gap: 8, padding: '14px 32px' }}>
                      <Send size={15} /> Send Message
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:640px){.contact-form-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
