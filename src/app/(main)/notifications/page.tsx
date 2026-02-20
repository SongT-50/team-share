'use client';

import { useState } from 'react';
import { NotificationList } from '@/components/features/notifications/NotificationList';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeam } from '@/hooks/useTeam';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

type Filter = 'all' | 'unread';

export default function NotificationsPage() {
  const { teamId, isLoading: teamLoading } = useTeam();
  const {
    notifications,
    isLoading,
    isError,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications(teamId);
  const [filter, setFilter] = useState<Filter>('all');

  if (teamLoading || isLoading) return <Spinner className="py-12" />;

  if (!teamId) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>팀에 소속되어 있지 않습니다.</p>
        <p className="text-sm mt-1">대시보드에서 팀을 생성하거나 초대 코드로 합류하세요.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">알림</h1>
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">알림을 불러오지 못했습니다.</p>
          <Button variant="secondary" size="sm" onClick={refresh}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  const displayed =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">알림</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            모두 읽음 처리
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          안읽음{unreadCount > 0 && ` (${unreadCount})`}
        </button>
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {displayed.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            {filter === 'unread' ? '안 읽은 알림이 없습니다' : '알림이 없습니다'}
          </p>
        ) : (
          <NotificationList notifications={displayed} onRead={markAsRead} />
        )}
      </div>
    </div>
  );
}
