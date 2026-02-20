'use client';

import { MemberCard } from './MemberCard';
import { Spinner } from '@/components/ui/Spinner';
import type { TeamMember } from '@/types';

interface MemberListProps {
  members: TeamMember[];
  currentUserId: string;
  isAdmin: boolean;
  isLoading: boolean;
  onRemoveMember: (memberId: string) => void;
}

export function MemberList({
  members,
  currentUserId,
  isAdmin,
  isLoading,
  onRemoveMember,
}: MemberListProps) {
  if (isLoading) {
    return <Spinner className="py-8" />;
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        팀 멤버가 없습니다.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-xl border divide-y">
      {members.map((member) => (
        <MemberCard
          key={member._id}
          member={member}
          isCurrentUser={member._id === currentUserId}
          canManage={isAdmin}
          onRemove={onRemoveMember}
        />
      ))}
    </div>
  );
}
