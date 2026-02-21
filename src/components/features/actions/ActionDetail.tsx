'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import type { ActionItem, ActionStatus, ActionType, TeamMember } from '@/types';
import { createNotification } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';

interface ActionDetailProps {
  action: ActionItem;
  members: TeamMember[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (actionId: string, data: Partial<ActionItem>) => Promise<void>;
  onDelete: (actionId: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  canDelete: boolean;
}

const typeLabels: Record<ActionType, { icon: string; label: string }> = {
  todo: { icon: '☑', label: '할일' },
  decision: { icon: '📋', label: '의사결정' },
  idea: { icon: '💡', label: '아이디어' },
};

export function ActionDetail({
  action,
  members,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
  canDelete,
}: ActionDetailProps) {
  const toast = useToast();
  const { user } = useAuth();
  const { teamId } = useTeam();
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editStatus, setEditStatus] = useState<ActionStatus>('open');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize edit state when action changes or modal opens
  useEffect(() => {
    if (isOpen && action) {
      setEditTitle(action.title);
      setEditContent(action.content);
      setEditTags(action.tags.join(', '));
      setEditDueDate(action.dueDate || '');
      setEditAssigneeId(action.assigneeId || '');
      setEditStatus(action.status);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, action]);

  const handleSave = async () => {
    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onUpdate(action.id, {
        title: editTitle.trim() || action.title,
        content: editContent,
        tags: parsedTags,
        dueDate: editDueDate || undefined,
        assigneeId: editAssigneeId || undefined,
        status: editStatus,
      });

      // Notification: assignee changed
      if (editAssigneeId && editAssigneeId !== action.assigneeId && user && teamId) {
        createNotification({
          teamId,
          recipientId: editAssigneeId,
          type: 'action',
          title: `${user.name}님이 액션을 할당했습니다`,
          body: editTitle.trim() || action.title,
          link: '/actions',
          sourceId: action.id,
        });
      }

      // Notification: status changed
      if (editStatus !== action.status && action.creatorId !== user?.id && user && teamId) {
        const statusLabels: Record<string, string> = { open: '열림', in_progress: '진행중', done: '완료' };
        createNotification({
          teamId,
          recipientId: action.creatorId,
          type: 'action',
          title: '액션 상태가 변경되었습니다',
          body: `${editTitle.trim() || action.title} → ${statusLabels[editStatus] || editStatus}`,
          link: '/actions',
          sourceId: action.id,
        });
      }

      toast.success('수정되었습니다');
      onClose();
    } catch {
      toast.error('수정에 실패했습니다');
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(action.id);
      toast.success('삭제되었습니다');
      onClose();
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  const typeInfo = typeLabels[action.actionType];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${typeInfo.icon} ${typeInfo.label}`}>
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">제목</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">내용</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">태그 (콤마로 구분)</label>
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="태그1, 태그2, 태그3"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">기한</label>
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">담당자</label>
          <select
            value={editAssigneeId}
            onChange={(e) => setEditAssigneeId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">미배정</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}{member.isAdmin ? ' (관리자)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">상태</label>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as ActionStatus)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="open">열림</option>
            <option value="in_progress">진행중</option>
            <option value="done">완료</option>
          </select>
        </div>

        {/* Meta info */}
        <div className="border-t pt-3">
          <p className="text-xs text-gray-400">
            생성: {formatDate(action.createdAt)} | 출처: 채팅 메시지
          </p>
        </div>

        {/* Delete confirm */}
        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 mb-2">정말 삭제하시겠습니까? 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>
                삭제하기
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                취소
              </Button>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {canDelete && !showDeleteConfirm && (
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                삭제하기
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={isUpdating}>
              저장하기
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
