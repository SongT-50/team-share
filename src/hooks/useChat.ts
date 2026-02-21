import { useState, useEffect, useCallback, useRef } from 'react';
import { bkend } from '@/lib/bkend';
import { useAuth } from './useAuth';
import type { ChatMessage } from '@/types';

export function useChat(teamId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const failCountRef = useRef(0);
  const { user } = useAuth();

  const loadMessages = useCallback(async () => {
    if (!teamId) return;
    try {
      const data = (await bkend.collection('chat_messages').find({})) as ChatMessage[];
      const all = Array.isArray(data) ? data : [];
      setMessages(all.filter((m) => m.teamId === teamId));
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
  }, [teamId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const sendMessage = useCallback(
    async (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string) => {
      if (!user || (!content.trim() && type === 'text')) return null;

      const message = (await bkend.collection('chat_messages').create({
        teamId,
        senderId: user.id,
        senderName: user.name,
        content: content.trim(),
        type,
        fileUrl,
        readBy: [user.id],
      })) as ChatMessage;

      setMessages((prev) => [...prev, message]);
      return message;
    },
    [teamId, user]
  );

  const sendFile = useCallback(
    async (file: File) => {
      const result = (await bkend.upload(file)) as { url: string };
      const isImage = file.type.startsWith('image/');
      return sendMessage(file.name, isImage ? 'image' : 'file', result.url);
    },
    [sendMessage]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      setIsDeleting(true);
      // Optimistic: remove locally first
      const prev = messages;
      setMessages((m) => m.filter((msg) => msg.id !== messageId));
      try {
        await bkend.collection('chat_messages').delete(messageId);
      } catch {
        // Rollback on failure
        setMessages(prev);
        throw new Error('메시지 삭제에 실패했습니다');
      } finally {
        setIsDeleting(false);
      }
    },
    [messages]
  );

  const markAsRead = useCallback(async () => {
    if (!user || !messages.length) return;
    const unread = messages.filter(
      (msg) => !msg.readBy.includes(user.id)
    );
    // Update each unread message — fire and forget
    await Promise.allSettled(
      unread.map((msg) =>
        bkend.collection('chat_messages').update(msg.id, {
          readBy: [...msg.readBy, user.id],
        })
      )
    );
  }, [messages, user]);

  const unreadCount = user
    ? messages.filter((msg) => !msg.readBy.includes(user.id)).length
    : 0;

  return {
    messages,
    isLoading,
    isError,
    sendMessage,
    sendFile,
    deleteMessage,
    markAsRead,
    unreadCount,
    isDeleting,
    refresh: loadMessages,
  };
}
