'use client';

import { LoginForm } from '@/components/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
