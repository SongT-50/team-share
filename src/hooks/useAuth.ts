import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const { user, token, isLoading, login, register, logout } = useAuthStore();

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };
}
