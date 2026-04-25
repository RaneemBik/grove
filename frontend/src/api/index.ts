import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('access_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('no refresh');
        const { data } = await axios.post(`${BASE}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        orig.headers.Authorization = `Bearer ${data.access}`;
        return api(orig);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        const onAuthRoute = window.location.pathname.startsWith('/auth/');
        if (!onAuthRoute) window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

export const productApi = {
  list: (params = {}) => api.get('/products/', { params }),
  detail: (slug: string) => api.get(`/products/${slug}/`),
  featured: () => api.get('/products/featured/'),
  newArrivals: () => api.get('/products/new-arrivals/'),
  categories: () => api.get('/products/categories/'),
  banners: () => api.get('/products/banners/active/'),
  addReview: (slug: string, data: any) => api.post(`/products/${slug}/reviews/`, data),
  wishlist: (page = 1) => api.get('/products/wishlist/', { params: { page } }),
  toggleWishlist: (productId: number) => api.post(`/products/wishlist/toggle/${productId}/`),
  removeWishlist: (id: number) => api.delete(`/products/wishlist/${id}/`),
};

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login/', { email, password }),
  register: (data: any) => api.post('/auth/register/', data),
  logout: (refresh: string) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data: any) => api.patch('/auth/profile/', data),
  changePassword: (data: any) => api.post('/auth/profile/change-password/', data),
  resetPassword: (data: any) => api.post('/auth/profile/reset-password/', data),
  addresses: () => api.get('/auth/addresses/'),
  createAddress: (data: any) => api.post('/auth/addresses/', data),
  updateAddress: (id: number, data: any) => api.patch(`/auth/addresses/${id}/`, data),
  deleteAddress: (id: number) => api.delete(`/auth/addresses/${id}/`),
  setDefault: (id: number) => api.post(`/auth/addresses/${id}/set-default/`),
  requestPasswordReset: (email: string) => api.post('/auth/password-reset/request/', { email }),
  confirmPasswordReset: (payload: { uid: string; token: string; new_password: string; new_password2: string }) => api.post('/auth/password-reset/confirm/', payload),
  subscribe: (plan: 'monthly' | 'yearly') => api.post('/auth/subscribe/', { plan }),
  confirmSubscription: (session_id: string) => api.post('/auth/subscribe/confirm/', { session_id }),
  cancelSubscription: () => api.post('/auth/subscribe/cancel/'),
};

export const cartApi = {
  get: () => api.get('/cart/'),
  add: (product_id: number, quantity: number, variant_sku_id?: number) => api.post('/cart/add/', { product_id, quantity, variant_sku_id }),
  addKit: (kit_slug: string) => api.post('/cart/add-kit/', { kit_slug }),
  update: (item_id: number, quantity: number) => api.patch(`/cart/items/${item_id}/`, { quantity }),
  remove: (item_id: number) => api.delete(`/cart/items/${item_id}/`),
  clear: () => api.delete('/cart/'),
};

export const orderApi = {
  checkout: (data: any) => api.post('/orders/checkout/', data),
  calculateTotal: (gift_box_fees: Array<{name: string; price: string}>) => api.post('/orders/calculate-total/', { gift_box_fees }),
  list: (page = 1) => api.get(`/orders/?page=${page}`),
  detail: (num: string) => api.get(`/orders/${num}/`),
  cancel: (num: string) => api.post(`/orders/${num}/cancel/`),
  confirmStripePayment: (num: string, session_id: string) => api.post(`/orders/${num}/confirm-payment/`, { session_id }),
};

export const contactApi = {
  send: (data: any) => api.post('/contact/', data),
};

export const giftBoxApi = {
  list: () => api.get('/gift-boxes/'),
  detail: (slug: string) => api.get(`/gift-boxes/${slug}/`),
  myOrders: () => api.get('/gift-boxes/orders/my/'),
  createOrder: (gift_box_id: number) => api.post('/gift-boxes/orders/create/', { gift_box_id }),
  getOrder: (order_id: number) => api.get(`/gift-boxes/orders/${order_id}/`),
  addItem: (order_id: number, product_id: number, quantity = 1) => api.post(`/gift-boxes/orders/${order_id}/add/`, { product_id, quantity }),
  removeItem: (order_id: number, item_id: number) => api.delete(`/gift-boxes/orders/${order_id}/items/${item_id}/remove/`),
  clearOrder: (order_id: number) => api.delete(`/gift-boxes/orders/${order_id}/clear/`),
};

export const seasonalKitApi = {
  list: () => api.get('/products/seasonal-kits/'),
};
