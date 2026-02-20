'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { bkend } from '@/lib/bkend';
import { useAuth } from './useAuth';
import type { Team, User, TeamMember } from '@/types';

export function useTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // 팀 목록 조회
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', user?._id],
    queryFn: async () => {
      const result = await bkend.collection('teams').find({});
      const allTeams = Array.isArray(result) ? (result as Team[]) : [];
      return allTeams.filter((t) => t.memberIds.includes(user!._id));
    },
    enabled: !!user,
  });

  const currentTeam = teams[0] || null;

  // 팀 멤버 상세 조회
  const { data: members = [], isLoading: isMembersLoading, isError: isMembersError, refetch: refetchMembers } = useQuery({
    queryKey: ['team-members', currentTeam?._id],
    queryFn: async () => {
      if (!currentTeam) return [];
      const result = await bkend.collection('users').find({});
      const allUsers = Array.isArray(result) ? (result as User[]) : [];
      return allUsers
        .filter((u) => currentTeam.memberIds.includes(u._id))
        .map((u): TeamMember => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          profileImage: u.profileImage,
          isAdmin: u._id === currentTeam.adminId,
          joinedAt: u.createdAt,
        }))
        .sort((a, b) => (a.isAdmin === b.isAdmin ? 0 : a.isAdmin ? -1 : 1));
    },
    enabled: !!currentTeam,
  });

  // 팀 정보 수정
  const updateTeamMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      return bkend.collection('teams').update(currentTeam!._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  // 멤버 추방
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const newMemberIds = currentTeam!.memberIds.filter((id) => id !== memberId);
      return bkend.collection('teams').update(currentTeam!._id, {
        memberIds: newMemberIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  // 팀 나가기
  const leaveTeamMutation = useMutation({
    mutationFn: async () => {
      const newMemberIds = currentTeam!.memberIds.filter((id) => id !== user!._id);
      return bkend.collection('teams').update(currentTeam!._id, {
        memberIds: newMemberIds,
      });
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });

  // 팀 삭제
  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      return bkend.collection('teams').delete(currentTeam!._id);
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });

  // 초대코드 재생성
  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await bkend.collection('teams').update(currentTeam!._id, {
        inviteCode: newCode,
      });
      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  return {
    teams,
    currentTeam,
    isLoading,
    teamId: currentTeam?._id || '',
    members,
    isMembersLoading,
    isMembersError,
    refetchMembers,
    updateTeam: updateTeamMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    leaveTeam: leaveTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,
    regenerateInviteCode: regenerateCodeMutation.mutateAsync,
    isUpdating: updateTeamMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
    isLeaving: leaveTeamMutation.isPending,
    isDeleting: deleteTeamMutation.isPending,
    isRegenerating: regenerateCodeMutation.isPending,
  };
}
