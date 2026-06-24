import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('nexum_user') || 'null'); } catch { return null; }
  })(),
  token: localStorage.getItem('nexum_token'),
  isAuthenticated: !!localStorage.getItem('nexum_token'),

  login(user, token) {
    localStorage.setItem('nexum_token', token);
    localStorage.setItem('nexum_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout() {
    localStorage.removeItem('nexum_token');
    localStorage.removeItem('nexum_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser(user) {
    localStorage.setItem('nexum_user', JSON.stringify(user));
    set({ user });
  },
}));
