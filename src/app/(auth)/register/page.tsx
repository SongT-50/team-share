'use client';

import { RegisterForm } from '@/components/features/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}
