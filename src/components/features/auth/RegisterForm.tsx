'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }

    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }

    try {
      await register(email, password, name);
      toast.success('회원가입 성공! 팀을 만들어보세요');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다';
      toast.error(message);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="이름"
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="이메일"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="비밀번호"
          type="password"
          placeholder="8자 이상"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          회원가입
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
