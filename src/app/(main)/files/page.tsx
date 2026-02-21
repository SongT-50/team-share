'use client';

import { useState, useEffect } from 'react';
import { FileUploader } from '@/components/features/files/FileUploader';
import { FileList } from '@/components/features/files/FileList';
import type { SortOption } from '@/components/features/files/FileList';
import { useTeam } from '@/hooks/useTeam';
import { useFiles } from '@/hooks/useFiles';
import { useAuth } from '@/hooks/useAuth';
import { createNotification } from '@/hooks/useNotifications';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

const sortLabels: Record<SortOption, string> = {
  newest: '최신순',
  oldest: '오래된순',
  name: '이름순',
  size: '크기순',
};

export default function FilesPage() {
  const { user, isAdmin } = useAuth();
  const { teamId, members, isLoading: teamLoading } = useTeam();
  const {
    files,
    isLoading: filesLoading,
    isError,
    refetch,
    refresh,
    deleteFile,
    updateFile,
    isDeleting,
    isUpdating,
  } = useFiles(teamId);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Debounce search — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (teamLoading) return <Spinner className="py-12" />;

  if (!teamId) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>팀에 소속되어 있지 않습니다.</p>
        <p className="text-sm mt-1">대시보드에서 팀을 생성하거나 초대 코드로 합류하세요.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">자료 공유</h1>

      <div className="mb-6">
        <FileUploader teamId={teamId} onUploaded={() => {
          refresh();
          if (user) {
            members
              .filter((m) => m.id !== user.id)
              .forEach((m) => {
                createNotification({
                  teamId,
                  recipientId: m.id,
                  type: 'file',
                  title: `${user.name}님이 파일을 업로드했습니다`,
                  body: '새 파일이 공유되었습니다',
                  link: '/files',
                });
              });
          }
        }} />
      </div>

      {/* Search + Sort bar */}
      <div className="flex gap-3 mb-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="파일 검색 (제목, 파일명)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          {(Object.keys(sortLabels) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              {sortLabels[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {isError ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">자료를 불러올 수 없습니다.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      ) : (
        <FileList
          files={files}
          isLoading={filesLoading}
          searchQuery={searchQuery}
          sortBy={sortBy}
          currentUserId={user?.id || ''}
          isAdmin={isAdmin}
          onUpdate={updateFile}
          onDelete={deleteFile}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
