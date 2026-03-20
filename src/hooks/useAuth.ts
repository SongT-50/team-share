import { useAuthStore } from '@/stores/auth-store';

// 슈퍼 관리자 이메일 — 팀 생성/삭제 등 최고 권한
const SUPER_ADMIN_EMAILS = ['higheun@gmail.com'];

export function useAuth() {
  const { user, token, isLoading, login, register, logout } = useAuthStore();

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isSuperAdmin: !!user && SUPER_ADMIN_EMAILS.includes(user.email),
    login,
    register,
    logout,
  };
}
