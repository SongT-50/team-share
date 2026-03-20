'use client';

import { useState } from 'react';
import { MemberList } from '@/components/features/team/MemberList';
import { InviteCodeCard } from '@/components/features/team/InviteCodeCard';
import { TeamSettings } from '@/components/features/team/TeamSettings';
import { TeamCreateForm } from '@/components/features/team/TeamCreateForm';
import { TeamJoinForm } from '@/components/features/team/TeamJoinForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

export default function TeamPage() {
  const { user, isSuperAdmin } = useAuth();
  const {
    currentTeam,
    isLoading,
    members,
    isMembersLoading,
    isMembersError,
    refetchMembers,
    updateTeam,
    removeMember,
    leaveTeam,
    deleteTeam,
    regenerateInviteCode,
    isUpdating,
    isRemoving,
    isLeaving,
    isDeleting,
    isRegenerating,
  } = useTeam();
  const toast = useToast();

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [removingFinal, setRemovingFinal] = useState(false);

  // 팀의 adminId로 관리자 판단 (bkend.ai 시스템 role 대신)
  const isAdmin = !!currentTeam && currentTeam.adminId === user?.id;

  if (isLoading) return <Spinner className="py-12" />;

  // No team - show onboarding
  if (!currentTeam) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">팀 관리</h1>
        <p className="text-gray-600 mb-8">{isSuperAdmin ? '팀을 만들거나 합류하세요.' : '초대 코드로 팀에 합류하세요.'}</p>
        <div className="space-y-3">
          {isSuperAdmin && (
            <Button className="w-full" size="lg" onClick={() => setShowCreateTeam(true)}>
              새 팀 만들기
            </Button>
          )}
          <Button className="w-full" size="lg" variant="secondary" onClick={() => setShowJoinTeam(true)}>
            초대 코드로 합류
          </Button>
        </div>
        <Modal isOpen={showCreateTeam} onClose={() => setShowCreateTeam(false)} title="새 팀 만들기">
          <TeamCreateForm onCreated={() => { setShowCreateTeam(false); window.location.reload(); }} />
        </Modal>
        <Modal isOpen={showJoinTeam} onClose={() => setShowJoinTeam(false)} title="팀 합류">
          <TeamJoinForm onJoined={() => { setShowJoinTeam(false); window.location.reload(); }} />
        </Modal>
      </div>
    );
  }

  // Step 1: Show confirm modal (does NOT call API)
  const requestRemoveMember = (memberId: string) => {
    setRemovingMemberId(memberId);
  };

  // Step 2: 1단계 확인 → 2단계로 이동
  const confirmRemoveStep2 = () => {
    setRemovingFinal(true);
  };

  // Step 3: 최종 확인 후 API 호출
  const confirmRemoveMember = async () => {
    if (!removingMemberId) return;
    try {
      await removeMember(removingMemberId);
      toast.success('멤버가 추방되었습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '멤버 추방에 실패했습니다';
      toast.error(message);
    }
    setRemovingMemberId(null);
    setRemovingFinal(false);
  };

  const handleUpdateTeam = async (data: { name: string; description: string }) => {
    try {
      await updateTeam(data);
      toast.success('팀 정보가 수정되었습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '팀 정보 수정에 실패했습니다';
      toast.error(message);
    }
  };

  const handleLeaveTeam = async () => {
    try {
      await leaveTeam();
      toast.success('팀에서 나갔습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '팀 나가기에 실패했습니다';
      toast.error(message);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam();
      toast.success('팀이 삭제되었습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '팀 삭제에 실패했습니다';
      toast.error(message);
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateInviteCode();
      toast.success('초대 코드가 재생성되었습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '초대 코드 재생성에 실패했습니다';
      toast.error(message);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentTeam.name}</h1>
          {currentTeam.description && (
            <p className="text-sm text-gray-500 mt-1">{currentTeam.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button size="sm" onClick={() => setShowCreateTeam(true)}>
              + 팀 추가
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setShowJoinTeam(true)}>
            합류
          </Button>
        </div>
      </div>

      {/* Create / Join Modals */}
      <Modal isOpen={showCreateTeam} onClose={() => setShowCreateTeam(false)} title="새 팀 만들기">
        <TeamCreateForm onCreated={() => { setShowCreateTeam(false); window.location.reload(); }} />
      </Modal>
      <Modal isOpen={showJoinTeam} onClose={() => setShowJoinTeam(false)} title="팀 합류">
        <TeamJoinForm onJoined={() => { setShowJoinTeam(false); window.location.reload(); }} />
      </Modal>

      {/* Top row: Invite Code + Team Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InviteCodeCard
          inviteCode={currentTeam.inviteCode}
          isAdmin={isAdmin}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
        />
        {isAdmin && (
          <TeamSettings
            team={currentTeam}
            isAdmin={isAdmin}
            onUpdateTeam={handleUpdateTeam}
            onLeaveTeam={handleLeaveTeam}
            onDeleteTeam={handleDeleteTeam}
            isUpdating={isUpdating}
            isLeaving={isLeaving}
            isDeleting={isDeleting}
          />
        )}
      </div>

      {/* Member List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          팀 멤버 ({members.length}명)
        </h2>
        {isMembersError ? (
          <div className="bg-white rounded-xl border p-6 text-center">
            <p className="text-sm text-gray-600 mb-3">멤버 목록을 불러올 수 없습니다.</p>
            <Button variant="secondary" size="sm" onClick={() => refetchMembers()}>
              다시 시도
            </Button>
          </div>
        ) : (
          <MemberList
            members={members}
            currentUserId={user?.id || ''}
            isAdmin={isAdmin}
            isLoading={isMembersLoading}
            onRemoveMember={requestRemoveMember}
          />
        )}
      </div>

      {/* Danger Zone (member only - admin sees it in TeamSettings) */}
      {!isAdmin && (
        <TeamSettings
          team={currentTeam}
          isAdmin={isAdmin}
          onUpdateTeam={handleUpdateTeam}
          onLeaveTeam={handleLeaveTeam}
          onDeleteTeam={handleDeleteTeam}
          isUpdating={isUpdating}
          isLeaving={isLeaving}
          isDeleting={isDeleting}
        />
      )}

      {/* Remove Member Confirm Modal — 1단계 */}
      {removingMemberId && !removingFinal && (
        <Modal
          isOpen={!!removingMemberId && !removingFinal}
          onClose={() => setRemovingMemberId(null)}
          title="멤버 추방"
        >
          <p className="text-sm text-gray-600 mb-4">
            이 멤버를 팀에서 추방하시겠습니까?
            <br />
            추방된 멤버는 초대 코드로 다시 합류할 수 있습니다.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setRemovingMemberId(null)}>
              취소
            </Button>
            <Button variant="danger" size="sm" onClick={confirmRemoveStep2}>
              추방하기
            </Button>
          </div>
        </Modal>
      )}

      {/* Remove Member Confirm Modal — 2단계 (최종 확인) */}
      {removingMemberId && removingFinal && (
        <Modal
          isOpen={!!removingMemberId && removingFinal}
          onClose={() => { setRemovingMemberId(null); setRemovingFinal(false); }}
          title="⚠️ 최종 확인"
        >
          <p className="text-sm text-red-600 font-medium mb-4">
            정말로 이 멤버를 추방하시겠습니까?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => { setRemovingMemberId(null); setRemovingFinal(false); }}>
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmRemoveMember}
              isLoading={isRemoving}
            >
              정말 추방하기
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
