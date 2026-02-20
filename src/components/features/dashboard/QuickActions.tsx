import Link from 'next/link';

const quickActions = [
  { href: '/chat', icon: '💬', label: '채팅', description: '대화하기' },
  { href: '/files', icon: '📁', label: '자료', description: '업로드' },
  { href: '/actions', icon: '📌', label: '액션', description: '관리하기' },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex flex-col items-center gap-1 p-4 bg-white rounded-xl border hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <span className="text-2xl">{action.icon}</span>
          <span className="text-sm font-medium">{action.label}</span>
          <span className="text-xs text-gray-400">{action.description}</span>
        </Link>
      ))}
    </div>
  );
}
