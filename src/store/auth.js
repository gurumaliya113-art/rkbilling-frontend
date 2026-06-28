import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,

      setSession: ({ token, refreshToken, user }) => set({ token, refreshToken, user }),
      setUser: (user) => set({ user }),

      isAuthenticated: () => !!get().token,
      hasRole: (...roles) => roles.includes(get().user?.role),
      isAdmin: () => get().user?.role === 'admin',
      canManage: () => ['admin', 'manager'].includes(get().user?.role),

      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: 'rk-auth' },
  ),
);
