'use client';

import { useState, useEffect } from 'react';
import { ChatRoom } from '@/components/features/chat/ChatRoom';
import { useTeam } from '@/hooks/useTeam';
import { Spinner } from '@/components/ui/Spinner';

export default function ChatPage() {
  const { teamId, currentTeam, isLoading } = useTeam();

  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (isLoading) return <Spinner className="py-12" />;

  if (!teamId) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>팀에 소속되어 있지 않습니다.</p>
        <p className="text-sm mt-1">대시보드에서 팀을 생성하거나 초대 코드로 합류하세요.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-4rem)] md:h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">💬 {currentTeam?.name} 채팅</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {currentTeam?.memberIds.length}명
          </span>
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) {
                setSearchInput('');
                setSearchQuery('');
              }
            }}
            className={`p-1.5 rounded-lg text-sm transition-colors ${
              showSearch ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="검색"
          >
            🔍
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="border-b bg-white px-6 py-2">
          <input
            type="text"
            placeholder="메시지 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}

      <ChatRoom teamId={teamId} searchQuery={searchQuery} />
    </div>
  );
}
