import { create } from 'zustand';
import { authApi } from '../api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setUser: (u: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      set({ isAuthenticated: true });
      const p = await authApi.profile();
      set({ user: p.data });
    } finally { set({ loading: false }); }
  },
  register: async (d) => {
    set({ loading: true });
    try {
      const { data } = await authApi.register(d);
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      set({ user: data.user, isAuthenticated: true });
    } finally { set({ loading: false }); }
  },
  logout: async () => {
    try {
      const r = localStorage.getItem('refresh_token');
      if (r) await authApi.logout(r);
    } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },
  fetchProfile: async () => {
    set({ loading: true });
    try {
      const { data } = await authApi.profile();
      set({ user: data, isAuthenticated: true });
    } catch { 
      set({ user: null, isAuthenticated: false }); 
    } finally {
      set({ loading: false });
    }
  },
  setUser: (u) => set({ user: u }),
}));
