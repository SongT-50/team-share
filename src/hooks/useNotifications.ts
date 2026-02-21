import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { bkend } from '@/lib/bkend';
import { useAuth } from './useAuth';
import { useNotificationStore } from '@/stores/notification-store';
import type { Notification, NotificationType } from '@/types';

export function useNotifications(teamId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const failCountRef = useRef(0);
  const { user } = useAuth();
  const { settings } = useNotificationStore();

  const loadNotifications = useCallback(async () => {
    if (!teamId || !user) return;
    try {
      const data = (await bkend.collection('notifications').find({})) as Notification[];
      const all = Array.isArray(data) ? data : [];
      setNotifications(
        all.filter((n) => n.teamId === teamId && n.recipientId === user.id)
      );
      failCountRef.current = 0;
      setIsError(false);
    } catch {
      failCountRef.current += 1;
      if (failCountRef.current >= 3) {
        setIsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [teamId, user]);

  // 10s polling
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Filter by notification settings
  const filtered = useMemo(
    () =>
      notifications.filter((n) => {
        if (n.type === 'chat' && !settings.chat) return false;
        if (n.type === 'file' && !settings.file) return false;
        if (n.type === 'action' && !settings.action) return false;
        return true;
      }),
    [notifications, settings]
  );

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await bkend.collection('notifications').update(id, { isRead: true });
    } catch {
      // optimistic — keep UI state
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await Promise.allSettled(
      unread.map((n) =>
        bkend.collection('notifications').update(n.id, { isRead: true })
      )
    );
  }, [notifications]);

  const unreadCount = filtered.filter((n) => !n.isRead).length;

  return {
    notifications: filtered,
    isLoading,
    isError,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}

export async function createNotification(params: {
  teamId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  sourceId?: string;
}): Promise<void> {
  try {
    await bkend.collection('notifications').create({
      ...params,
      isRead: false,
    });
  } catch {
    // Notification creation failure should not affect main functionality
  }
}
