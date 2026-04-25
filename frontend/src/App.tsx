import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import GiftBoxPage from './pages/GiftBoxPage';
import SeasonalKitsPage from './pages/SeasonalKitsPage';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import { AccountLayout, ProfilePage, OrdersPage, OrderDetailPage, AddressesPage } from './pages/AccountPages';
import ContactPage from './pages/ContactPage';
import { useAuth } from './store/authStore';

function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 24, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(80px,20vw,160px)', color: 'var(--sand)', lineHeight: 1 }}>404</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: 340 }}>The page you're looking for doesn't exist.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/" className="btn btn-primary" style={{ borderRadius: 100 }}>Go Home</a>
        <a href="/products" className="btn btn-outline" style={{ borderRadius: 100 }}>Browse Products</a>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const hasToken = !!localStorage.getItem('access_token');
  if (!isAuthenticated && !hasToken) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { fetchProfile } = useAuth();
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) fetchProfile();
  }, []);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <CartDrawer />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/gift-boxes" element={<GiftBoxPage />} />
            <Route path="/seasonal-kits" element={<SeasonalKitsPage />} />
            <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
              <Route index element={<ProfilePage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderNumber" element={<OrderDetailPage />} />
              <Route path="addresses" element={<AddressesPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--green)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, borderRadius: 14, boxShadow: 'var(--shadow-lg)' },
        success: { iconTheme: { primary: 'var(--lime)', secondary: 'var(--green)' } },
        error: { style: { background: '#1a1a1a' } },
      }} />
    </BrowserRouter>
  );
}
