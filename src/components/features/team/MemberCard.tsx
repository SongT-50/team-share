'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { TeamMember } from '@/types';

interface MemberCardProps {
  member: TeamMember;
  isCurrentUser: boolean;
  canManage: boolean;
  onRemove: (memberId: string) => void;
}

export function MemberCard({ member, isCurrentUser, canManage, onRemove }: MemberCardProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={member.name} src={member.profileImage} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{member.name}</span>
            {isCurrentUser && (
              <span className="text-xs text-gray-400">(나)</span>
            )}
            {member.isAdmin && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                관리자
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{member.email}</p>
        </div>
      </div>

      {canManage && !isCurrentUser && !member.isAdmin && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
          onClick={() => onRemove(member.id)}
        >
          추방
        </Button>
      )}
    </div>
  );
}
