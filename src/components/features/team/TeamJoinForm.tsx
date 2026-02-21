'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { bkend } from '@/lib/bkend';
import { useAuth } from '@/hooks/useAuth';
import type { Team } from '@/types';

interface TeamJoinFormProps {
  onJoined: (team: Team) => void;
}

export function TeamJoinForm({ onJoined }: TeamJoinFormProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !user) return;

    setIsLoading(true);
    try {
      const teams = (await bkend.collection('teams').find({
        inviteCode: inviteCode.trim().toUpperCase(),
      })) as Team[];

      if (!Array.isArray(teams) || teams.length === 0) {
        toast.error('초대 코드가 유효하지 않습니다');
        return;
      }

      const team = teams[0];

      if (team.memberIds.includes(user.id)) {
        toast.info('이미 이 팀에 소속되어 있습니다');
        onJoined(team);
        return;
      }

      const updatedTeam = (await bkend.collection('teams').update(team.id, {
        memberIds: [...team.memberIds, user.id],
      })) as Team;

      toast.success(`"${team.name}" 팀에 합류했습니다!`);
      onJoined(updatedTeam);
    } catch (error) {
      const message = error instanceof Error ? error.message : '팀 합류에 실패했습니다';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="초대 코드"
        placeholder="6자리 초대 코드 입력"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
        maxLength={6}
        required
      />
      <Button type="submit" className="w-full" isLoading={isLoading}>
        팀 합류
      </Button>
    </form>
  );
}
