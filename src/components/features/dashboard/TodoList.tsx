'use client';

import Link from 'next/link';
import type { ActionItem, ActionStatus, TeamMember } from '@/types';

const statusIcon: Record<ActionStatus, { icon: string; color: string }> = {
  open: { icon: '○', color: 'text-gray-400 hover:text-blue-500' },
  in_progress: { icon: '◐', color: 'text-blue-500 hover:text-green-500' },
  done: { icon: '●', color: 'text-green-500 hover:text-gray-400' },
};

function nextStatus(current: ActionStatus): ActionStatus {
  const cycle: Record<ActionStatus, ActionStatus> = {
    open: 'in_progress',
    in_progress: 'done',
    done: 'open',
  };
  return cycle[current];
}

function getMemberName(assigneeId: string | undefined, members: TeamMember[]): string {
  if (!assigneeId) return '미배정';
  const member = members.find((m) => m._id === assigneeId);
  return member?.name || '미배정';
}

function isDueWarning(dueDate: string | undefined): boolean {
  if (!dueDate) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() <= now.getTime();
}

interface TodoListProps {
  todos: ActionItem[];
  members: TeamMember[];
  onToggle: (id: string, status: ActionStatus) => void;
}

export function TodoList({ todos, members, onToggle }: TodoListProps) {
  // Show open/in_progress first, then limit to 5
  const activeTodos = todos
    .filter((t) => t.status !== 'done')
    .slice(0, 5);

  if (todos.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400 text-sm mb-2">
          채팅에서 메시지를 할일로 변환해보세요
        </p>
        <Link href="/chat" className="text-sm text-blue-600 hover:text-blue-700">
          채팅으로 이동 &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {activeTodos.map((todo) => {
          const { icon, color } = statusIcon[todo.status];
          return (
            <li key={todo._id} className="flex items-start gap-3 p-3 rounded-lg border">
              <button
                onClick={() => onToggle(todo._id, nextStatus(todo.status))}
                className={`mt-0.5 text-lg flex-shrink-0 transition-colors ${color}`}
                title={`상태: ${todo.status}`}
              >
                {icon}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{todo.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {getMemberName(todo.assigneeId, members)}
                  </span>
                  {todo.dueDate && (
                    <span
                      className={`text-xs ${isDueWarning(todo.dueDate) ? 'text-red-500' : 'text-gray-400'}`}
                    >
                      기한: {todo.dueDate}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {todos.filter((t) => t.status !== 'done').length > 5 && (
        <div className="mt-3 text-right">
          <Link href="/actions" className="text-sm text-blue-600 hover:text-blue-700">
            전체 보기 ({todos.filter((t) => t.status !== 'done').length}개) &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
