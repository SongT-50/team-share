'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
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

export function MobileNav() {
  const pathname = usePathname();
  const { teamId } = useTeam();
  const { unreadCount } = useChat(teamId);
  const { unreadCount: notificationUnreadCount } = useNotifications(teamId);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
      <div className="flex justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors relative',
              pathname === item.href
                ? 'text-blue-600'
                : 'text-gray-500'
            )}
          >
            <span className="text-lg relative">
              {item.icon}
              {item.href === '/chat' && unreadCount > 0 && (
                <Badge
                  count={unreadCount}
                  className="absolute -top-2 -right-3 scale-75"
                />
              )}
              {item.href === '/notifications' && notificationUnreadCount > 0 && (
                <Badge
                  count={notificationUnreadCount}
                  className="absolute -top-2 -right-3 scale-75"
                />
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
