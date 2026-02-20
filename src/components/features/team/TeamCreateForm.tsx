'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { bkend } from '@/lib/bkend';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types';

interface TeamCreateFormProps {
  onCreated: (team: Team) => void;
}

export function TeamCreateForm({ onCreated }: TeamCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setIsLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const team = (await bkend.collection('teams').create({
        name: name.trim(),
        description: description.trim(),
        adminId: user._id,
        memberIds: [user._id],
        inviteCode,
      })) as Team;

      toast.success(`팀 "${name}"이 생성되었습니다!`);
      onCreated(team);
    } catch (error) {
      const message = error instanceof Error ? error.message : '팀 생성에 실패했습니다';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="팀 이름"
        placeholder="팀 이름을 입력하세요"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="설명 (선택)"
        placeholder="팀에 대한 간단한 설명"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit" className="w-full" isLoading={isLoading}>
        팀 생성
      </Button>
    </form>
  );
}
