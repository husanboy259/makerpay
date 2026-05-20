import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'support' | 'user';
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  viewMode: 'default' | 'merchant';
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setViewMode: (mode: 'default' | 'merchant') => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      viewMode: 'default',
      setAuth: (user, token) => set({ user, token, viewMode: 'default' }),
      logout: () => set({ user: null, token: null, viewMode: 'default' }),
      updateUser: (data) =>
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    { name: 'makerpay-auth' },
  ),
);
