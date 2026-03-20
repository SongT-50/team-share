'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { Team } from '@/types';

interface TeamSettingsProps {
  team: Team;
  isAdmin: boolean;
  onUpdateTeam: (data: { name: string; description: string }) => Promise<unknown>;
  onLeaveTeam: () => Promise<unknown>;
  onDeleteTeam: () => Promise<unknown>;
  isUpdating: boolean;
  isLeaving: boolean;
  isDeleting: boolean;
}

export function TeamSettings({
  team,
  isAdmin,
  onUpdateTeam,
  onLeaveTeam,
  onDeleteTeam,
  isUpdating,
  isLeaving,
  isDeleting,
}: TeamSettingsProps) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLeaveFinal, setShowLeaveFinal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFinal, setShowDeleteFinal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const hasChanges = name !== team.name || description !== (team.description || '');

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await onUpdateTeam({ name: name.trim(), description: description.trim() });
    } catch {
      // error handled by parent via toast
    }
  };

  const handleLeaveStep2 = () => {
    setShowLeaveConfirm(false);
    setShowLeaveFinal(true);
  };

  const handleLeave = async () => {
    try {
      await onLeaveTeam();
    } catch {
      // error handled by parent
    }
    setShowLeaveFinal(false);
  };

  const handleDeleteStep2 = () => {
    setShowDeleteConfirm(false);
    setShowDeleteFinal(true);
  };

  const handleDelete = async () => {
    try {
      await onDeleteTeam();
    } catch {
      // error handled by parent
    }
    setShowDeleteFinal(false);
  };

  return (
    <>
      {/* Team Info Edit (admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">팀 설정</h3>
          <div className="space-y-3">
            <Input
              label="팀 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="팀 이름"
            />
            <Input
              label="설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="팀에 대한 간단한 설명"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || !name.trim()}
              isLoading={isUpdating}
            >
              저장
            </Button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <h3 className="text-sm font-semibold text-red-600 mb-4">위험 영역</h3>
        <div className="space-y-3">
          {!isAdmin && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">팀 나가기</p>
                <p className="text-xs text-gray-500">이 팀에서 탈퇴합니다.</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowLeaveConfirm(true)}
              >
                나가기
              </Button>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">팀 삭제</p>
                <p className="text-xs text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                삭제
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Leave Confirm Modal — 1단계 */}
      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="팀 나가기"
      >
        <p className="text-sm text-gray-600 mb-4">
          &quot;{team.name}&quot; 팀에서 나가시겠습니까?
          <br />
          초대 코드로 다시 합류할 수 있습니다.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowLeaveConfirm(false)}>
            취소
          </Button>
          <Button variant="danger" size="sm" onClick={handleLeaveStep2}>
            나가기
          </Button>
        </div>
      </Modal>

      {/* Leave Confirm Modal — 2단계 (최종 확인) */}
      <Modal
        isOpen={showLeaveFinal}
        onClose={() => setShowLeaveFinal(false)}
        title="⚠️ 최종 확인"
      >
        <p className="text-sm text-red-600 font-medium mb-4">
          정말로 &quot;{team.name}&quot; 팀에서 나가시겠습니까?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowLeaveFinal(false)}>
            취소
          </Button>
          <Button variant="danger" size="sm" onClick={handleLeave} isLoading={isLeaving}>
            정말 나가기
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm Modal — 1단계 (팀 이름 입력) */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }}
        title="팀 삭제"
      >
        <p className="text-sm text-gray-600 mb-2">
          &quot;{team.name}&quot; 팀을 삭제하시겠습니까?
        </p>
        <p className="text-sm text-red-600 mb-4">
          이 작업은 되돌릴 수 없으며, 모든 팀 데이터가 삭제됩니다.
        </p>
        <Input
          label={`확인하려면 "${team.name}" 을 입력하세요`}
          value={deleteConfirmName}
          onChange={(e) => setDeleteConfirmName(e.target.value)}
          placeholder={team.name}
        />
        <div className="flex gap-2 justify-end mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }}
          >
            취소
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteStep2}
            disabled={deleteConfirmName !== team.name}
          >
            다음
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm Modal — 2단계 (최종 확인) */}
      <Modal
        isOpen={showDeleteFinal}
        onClose={() => setShowDeleteFinal(false)}
        title="⚠️ 최종 확인"
      >
        <p className="text-sm text-red-600 font-bold mb-2">
          정말로 &quot;{team.name}&quot; 팀을 삭제하시겠습니까?
        </p>
        <p className="text-sm text-gray-600 mb-4">
          모든 채팅, 파일, 액션, 알림이 영구 삭제됩니다.
          <br />
          이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowDeleteFinal(false)}>
            취소
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>
            영구 삭제
          </Button>
        </div>
      </Modal>
    </>
  );
}
