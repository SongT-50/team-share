'use client';

import { useState } from 'react';
import { ActionList } from '@/components/features/actions/ActionList';
import { ActionDetail } from '@/components/features/actions/ActionDetail';
import { useTeam } from '@/hooks/useTeam';
import { useActions } from '@/hooks/useActions';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import type { ActionItem, ActionType, ActionStatus } from '@/types';

type ActionTab = 'all' | ActionType;
type ActionStatusFilter = 'all' | ActionStatus;
type ActionSortOption = 'newest' | 'oldest' | 'dueDate' | 'status';

const tabConfig: { key: ActionTab; icon: string; label: string }[] = [
  { key: 'all', icon: '', label: '전체' },
  { key: 'todo', icon: '☑', label: '할일' },
  { key: 'decision', icon: '📋', label: '의사결정' },
  { key: 'idea', icon: '💡', label: '아이디어' },
];

const sortLabels: Record<ActionSortOption, string> = {
  newest: '최신순',
  oldest: '오래된순',
  dueDate: '기한순',
  status: '상태순',
};

function sortActions(items: ActionItem[], sortBy: ActionSortOption): ActionItem[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'status': {
        const order: Record<ActionStatus, number> = { open: 0, in_progress: 1, done: 2 };
        return order[a.status] - order[b.status];
      }
      default:
        return 0;
    }
  });
}

export default function ActionsPage() {
  const { user, isAdmin } = useAuth();
  const { teamId, members, isLoading: teamLoading } = useTeam();
  const {
    actions,
    isLoading: actionsLoading,
    isError,
    refetch,
    updateStatus,
    updateAction,
    deleteAction,
    isUpdating,
    isDeleting,
  } = useActions(teamId);

  const [activeTab, setActiveTab] = useState<ActionTab>('all');
  const [statusFilter, setStatusFilter] = useState<ActionStatusFilter>('all');
  const [sortBy, setSortBy] = useState<ActionSortOption>('newest');
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);

  if (teamLoading) return <Spinner className="py-12" />;

  if (!teamId) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>팀에 소속되어 있지 않습니다.</p>
        <p className="text-sm mt-1">대시보드에서 팀을 생성하거나 초대 코드로 합류하세요.</p>
      </div>
    );
  }

  // 1. Tab filter
  const tabFiltered = activeTab === 'all'
    ? actions
    : actions.filter((a) => a.actionType === activeTab);

  // 2. Status filter
  const statusFiltered = statusFilter === 'all'
    ? tabFiltered
    : tabFiltered.filter((a) => a.status === statusFilter);

  // 3. Sort
  const sorted = sortActions(statusFiltered, sortBy);

  const canDeleteAction = (action: ActionItem) =>
    action.creatorId === user?.id || isAdmin;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📌 액션 아이템</h1>
        <span className="text-sm text-gray-500">{actions.length}개</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {tabConfig.map((tab) => {
          const count = tab.key === 'all'
            ? actions.length
            : actions.filter((a) => a.actionType === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon && <span className="mr-1">{tab.icon}</span>}
              {tab.label}
              <span className="ml-1 text-xs text-gray-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Filter + Sort bar */}
      <div className="flex gap-3 mb-4 items-center">
        <div className="flex-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ActionStatusFilter)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="all">상태: 전체</option>
            <option value="open">열림</option>
            <option value="in_progress">진행중</option>
            <option value="done">완료</option>
          </select>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as ActionSortOption)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          {(Object.keys(sortLabels) as ActionSortOption[]).map((key) => (
            <option key={key} value={key}>
              {sortLabels[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {isError ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">액션을 불러올 수 없습니다.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      ) : (
        <ActionList
          actions={sorted}
          isLoading={actionsLoading}
          members={members}
          onSelect={setSelectedAction}
          onStatusChange={(id, status) => updateStatus({ id, status })}
        />
      )}

      {/* ActionDetail Modal */}
      {selectedAction && (
        <ActionDetail
          action={selectedAction}
          members={members}
          isOpen={!!selectedAction}
          onClose={() => setSelectedAction(null)}
          onUpdate={updateAction}
          onDelete={deleteAction}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          canDelete={canDeleteAction(selectedAction)}
        />
      )}
    </div>
  );
}
