'use client';

import { Spinner } from '@/components/ui/Spinner';
import type { ActionItem, ActionStatus, ActionType } from '@/types';
import type { TeamMember } from '@/types';

interface ActionListProps {
  actions: ActionItem[];
  isLoading: boolean;
  members: TeamMember[];
  onSelect: (action: ActionItem) => void;
  onStatusChange: (id: string, status: ActionStatus) => void;
}

const typeConfig: Record<ActionType, { icon: string; label: string }> = {
  todo: { icon: '☑', label: '할일' },
  decision: { icon: '📋', label: '의사결정' },
  idea: { icon: '💡', label: '아이디어' },
};

const statusConfig: Record<ActionStatus, { label: string; className: string }> = {
  open: { label: '열림', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '진행중', className: 'bg-yellow-100 text-yellow-700' },
  done: { label: '완료', className: 'bg-green-100 text-green-700' },
};

function formatDueDate(dueDate?: string): string | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ActionList({ actions, isLoading, members, onSelect, onStatusChange }: ActionListProps) {
  if (isLoading) return <Spinner className="py-12" />;

  if (actions.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        아직 액션 아이템이 없습니다.<br />
        채팅에서 메시지를 클릭하여 변환해보세요.
      </p>
    );
  }

  const getMemberName = (assigneeId?: string) => {
    if (!assigneeId) return '미배정';
    const member = members.find((m) => m.id === assigneeId);
    return member?.name || '미배정';
  };

  return (
    <div className="space-y-2">
      {actions.map((action) => {
        const type = typeConfig[action.actionType];
        const status = statusConfig[action.status];
        const dueStr = formatDueDate(action.dueDate);

        return (
          <div
            key={action.id}
            onClick={() => onSelect(action)}
            className="bg-white rounded-lg border p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{type.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${action.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {action.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    👤 {getMemberName(action.assigneeId)}
                  </span>
                  {dueStr && (
                    <span className="text-xs text-gray-400">
                      📅 {dueStr}
                    </span>
                  )}
                  {action.tags.length > 0 && (
                    <span className="text-xs text-gray-300">
                      {action.tags.slice(0, 2).join(', ')}
                      {action.tags.length > 2 && ` +${action.tags.length - 2}`}
                    </span>
                  )}
                </div>
              </div>
              <select
                value={action.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onStatusChange(action.id, e.target.value as ActionStatus);
                }}
                className="text-xs border rounded px-1.5 py-1 bg-white flex-shrink-0"
              >
                <option value="open">열림</option>
                <option value="in_progress">진행중</option>
                <option value="done">완료</option>
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
