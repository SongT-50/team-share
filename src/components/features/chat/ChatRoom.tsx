'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Spinner } from '@/components/ui/Spinner';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { createNotification } from '@/hooks/useNotifications';

interface ChatRoomProps {
  teamId: string;
  searchQuery: string;
}

function isSameDay(d1: string, d2: string): boolean {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export function ChatRoom({ teamId, searchQuery }: ChatRoomProps) {
  const {
    messages,
    isLoading,
    isError,
    sendMessage,
    sendFile,
    deleteMessage,
    markAsRead,
    isDeleting,
    refresh,
  } = useChat(teamId);
  const { user } = useAuth();
  const { currentTeam, members } = useTeam();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const memberCount = currentTeam?.memberIds?.length || 0;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  // Filter messages by search query
  const filtered = searchQuery.trim()
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (isLoading) return <Spinner className="py-12" />;

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">메시지를 불러올 수 없습니다.</p>
          <button
            onClick={refresh}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch {
      // Toast is handled by the caller or we can ignore since optimistic rollback happens
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            {searchQuery
              ? `"${searchQuery}" 검색 결과가 없습니다`
              : '아직 메시지가 없습니다. 첫 메시지를 보내보세요!'}
          </p>
        ) : (
          filtered.map((msg, idx) => {
            const prev = idx > 0 ? filtered[idx - 1] : null;
            const showDateSeparator =
              !prev || !isSameDay(prev.createdAt, msg.createdAt);

            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isMine={msg.senderId === user?.id}
                  teamId={teamId}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                  memberCount={memberCount}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 right-4 px-3 py-1.5 bg-white border shadow-md rounded-full text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ↓ 새 메시지
          </button>
        </div>
      )}

      <MessageInput
        onSendMessage={async (content, type, fileUrl) => {
          const result = await sendMessage(content, type, fileUrl);
          if (result && user) {
            members
              .filter((m) => m.id !== user.id)
              .forEach((m) => {
                createNotification({
                  teamId,
                  recipientId: m.id,
                  type: 'chat',
                  title: `${user.name}님이 메시지를 보냈습니다`,
                  body: content.length > 50 ? content.slice(0, 50) + '...' : content,
                  link: '/chat',
                  sourceId: result.id,
                });
              });
          }
          return result;
        }}
        onSendFile={sendFile}
      />
    </div>
  );
}
