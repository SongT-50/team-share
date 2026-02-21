import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from '@/types';
import { bkend } from '@/lib/bkend';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { accessToken, refreshToken } = (await bkend.auth.login({
            email,
            password,
          })) as AuthResponse;
          localStorage.setItem('auth-token', accessToken);
          localStorage.setItem('refresh-token', refreshToken);

          // Fetch user profile
          const me = (await bkend.auth.me()) as Record<string, unknown>;
          const user: User = {
            id: (me.id as string) || '',
            email: (me.email as string) || '',
            name: (me.name as string) || (me.nickname as string) || '',
            role: me.role === 'admin' ? 'admin' : 'member',
            createdAt: (me.createdAt as string) || '',
            updatedAt: (me.updatedAt as string) || '',
          };
          set({ user, token: accessToken, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const { accessToken, refreshToken } = (await bkend.auth.register({
            email,
            password,
            name,
          })) as AuthResponse;
          localStorage.setItem('auth-token', accessToken);
          localStorage.setItem('refresh-token', refreshToken);

          // Fetch user profile
          const me = (await bkend.auth.me()) as Record<string, unknown>;
          const user: User = {
            id: (me.id as string) || '',
            email: (me.email as string) || '',
            name: (me.name as string) || (me.nickname as string) || '',
            role: me.role === 'admin' ? 'admin' : 'member',
            createdAt: (me.createdAt as string) || '',
            updatedAt: (me.updatedAt as string) || '',
          };
          set({ user, token: accessToken, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        bkend.auth.logout();
        set({ user: null, token: null });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
