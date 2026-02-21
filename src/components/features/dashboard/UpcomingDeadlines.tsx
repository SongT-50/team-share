import Link from 'next/link';
import type { ActionItem, TeamMember } from '@/types';

function daysUntilDue(dueDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(daysUntil: number): string {
  if (daysUntil < 0) return '기한 지남';
  if (daysUntil === 0) return '오늘';
  if (daysUntil === 1) return '내일';
  return `${daysUntil}일 남음`;
}

function urgencyColor(daysUntil: number): string {
  if (daysUntil <= 1) return 'text-red-600 bg-red-50';
  if (daysUntil <= 3) return 'text-orange-600 bg-orange-50';
  return 'text-gray-600 bg-gray-50';
}

const typeIcons: Record<string, string> = {
  todo: '☑',
  decision: '📋',
  idea: '💡',
};

function getMemberName(assigneeId: string | undefined, members: TeamMember[]): string {
  if (!assigneeId) return '미배정';
  const member = members.find((m) => m.id === assigneeId);
  return member?.name || '미배정';
}

interface UpcomingDeadlinesProps {
  actions: ActionItem[];
  members: TeamMember[];
}

export function UpcomingDeadlines({ actions, members }: UpcomingDeadlinesProps) {
  const upcoming = actions
    .filter((a) => a.dueDate && a.status !== 'done')
    .map((a) => ({
      ...a,
      daysUntil: daysUntilDue(a.dueDate!),
    }))
    .filter((a) => a.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <p className="text-center text-gray-400 py-6 text-sm">
        7일 이내 기한이 없습니다
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {upcoming.map((action) => (
          <li
            key={action.id}
            className="flex items-center gap-3 p-3 rounded-lg border"
          >
            <span className="text-lg">{typeIcons[action.actionType] || '📌'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{action.title}</p>
              <p className="text-xs text-gray-400">
                담당: {getMemberName(action.assigneeId, members)}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${urgencyColor(action.daysUntil)}`}
            >
              {urgencyLabel(action.daysUntil)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 text-right">
        <Link href="/actions" className="text-sm text-blue-600 hover:text-blue-700">
          액션 전체 보기 &rarr;
        </Link>
      </div>
    </div>
  );
}
