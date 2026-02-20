'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useChat } from '@/hooks/useChat';
import { useNotifications } from '@/hooks/useNotifications';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/chat', label: '채팅', icon: '💬' },
  { href: '/files', label: '자료', icon: '📁' },
  { href: '/actions', label: '액션', icon: '📌' },
  { href: '/notifications', label: '알림', icon: '🔔' },
  { href: '/team', label: '팀', icon: '👥' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { teamId } = useTeam();
  const { unreadCount } = useChat(teamId);
  const { unreadCount: notificationUnreadCount } = useNotifications(teamId);

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r h-screen sticky top-0">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-blue-600">Team Share</h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <span>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.href === '/chat' && <Badge count={unreadCount} />}
            {item.href === '/notifications' && <Badge count={notificationUnreadCount} />}
          </Link>
        ))}
      </nav>

      {user && (
        <div className="p-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={user.name} src={user.profileImage} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
          >
            로그아웃
          </button>
        </div>
      )}
    </aside>
  );
}
