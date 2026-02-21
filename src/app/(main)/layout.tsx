'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/features/layout/Sidebar';
import { MobileNav } from '@/components/features/layout/MobileNav';
import { ToastProvider } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist hydration before checking auth
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, isLoading, router]);

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </ToastProvider>
  );
}
