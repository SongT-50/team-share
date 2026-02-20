import Link from 'next/link';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  href: string;
  progress?: number;
  color?: string;
}

function StatCard({ icon, label, value, sub, href, progress, color = 'bg-blue-600' }: StatCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border p-4 hover:bg-gray-50 transition-colors block"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {progress !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div
            className={`${color} h-1.5 rounded-full transition-all`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Link>
  );
}

interface DashboardStatsProps {
  todoCount: { done: number; total: number };
  fileCount: number;
  decisionCount: number;
  ideaCount: number;
  memberCount: number;
  unreadCount: number;
}

export function DashboardStats({
  todoCount,
  fileCount,
  decisionCount,
  ideaCount,
  memberCount,
  unreadCount,
}: DashboardStatsProps) {
  const todoProgress = todoCount.total > 0
    ? Math.round((todoCount.done / todoCount.total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <StatCard
        icon="☑"
        label="할일"
        value={`${todoCount.done}/${todoCount.total}`}
        sub={todoCount.total > 0 ? `${todoProgress}%` : '-'}
        href="/actions"
        progress={todoCount.total > 0 ? todoProgress : undefined}
        color="bg-blue-600"
      />
      <StatCard icon="📁" label="자료" value={fileCount} href="/files" />
      <StatCard icon="📋" label="의사결정" value={decisionCount} href="/actions" />
      <StatCard icon="💡" label="아이디어" value={ideaCount} href="/actions" />
      <StatCard icon="👥" label="멤버" value={memberCount} href="/team" />
      <StatCard icon="💬" label="안 읽은 메시지" value={unreadCount} href="/chat" />
    </div>
  );
}
