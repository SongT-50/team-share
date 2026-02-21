'use client';

import { useRouter } from 'next/navigation';
import type { Notification, NotificationType } from '@/types';

const typeIcons: Record<NotificationType, string> = {
  chat: '💬',
  file: '📁',
  action: '📌',
  team: '👥',
  deadline: '⏰',
};

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

interface NotificationListProps {
  notifications: Notification[];
  onRead: (id: string) => void;
}

export function NotificationList({ notifications, onRead }: NotificationListProps) {
  const router = useRouter();

  if (notifications.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">
        알림이 없습니다
      </p>
    );
  }

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <ul className="divide-y">
      {notifications.map((n) => (
        <li
          key={n.id}
          onClick={() => handleClick(n)}
          className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${
            n.isRead
              ? 'bg-white hover:bg-gray-50'
              : 'bg-blue-50 border-l-2 border-blue-500 hover:bg-blue-100'
          }`}
        >
          <span className="text-lg mt-0.5">
            {typeIcons[n.type] || '🔔'}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'font-medium text-gray-900'}`}>
              {n.title}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {n.body}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatRelativeTime(n.createdAt)}
            </span>
            {!n.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
