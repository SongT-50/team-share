'use client';

import { useState } from 'react';
import { FileCard } from './FileCard';
import { FileDetail } from './FileDetail';
import { Spinner } from '@/components/ui/Spinner';
import type { SharedFile } from '@/types';

export type SortOption = 'newest' | 'oldest' | 'name' | 'size';

interface FileListProps {
  files: SharedFile[];
  isLoading: boolean;
  searchQuery: string;
  sortBy: SortOption;
  currentUserId: string;
  isAdmin: boolean;
  onUpdate: (fileId: string, data: Partial<SharedFile>) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

type FileFilter = 'all' | 'image' | 'document' | 'other';

const filterLabels: Record<FileFilter, string> = {
  all: '전체',
  image: '이미지',
  document: '문서',
  other: '기타',
};

function sortFiles(files: SharedFile[], sortBy: SortOption): SharedFile[] {
  return [...files].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name':
        return a.title.localeCompare(b.title, 'ko');
      case 'size':
        return b.fileSize - a.fileSize;
      default:
        return 0;
    }
  });
}

function filterBySearch(files: SharedFile[], query: string): SharedFile[] {
  if (!query.trim()) return files;
  const lower = query.toLowerCase();
  return files.filter(
    (f) =>
      f.title.toLowerCase().includes(lower) ||
      f.fileName.toLowerCase().includes(lower)
  );
}

export function FileList({
  files,
  isLoading,
  searchQuery,
  sortBy,
  currentUserId,
  isAdmin,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: FileListProps) {
  const [filter, setFilter] = useState<FileFilter>('all');
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null);

  // Apply: type filter → search → sort
  const typeFiltered = filter === 'all' ? files : files.filter((f) => f.fileType === filter);
  const searched = filterBySearch(typeFiltered, searchQuery);
  const sorted = sortFiles(searched, sortBy);

  if (isLoading) return <Spinner className="py-12" />;

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(Object.keys(filterLabels) as FileFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterLabels[key]}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          {searchQuery
            ? `"${searchQuery}" 검색 결과가 없습니다`
            : filter === 'all'
              ? '아직 공유된 자료가 없습니다'
              : `${filterLabels[filter]} 파일이 없습니다`}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((file) => (
            <FileCard key={file.id} file={file} onClick={() => setSelectedFile(file)} />
          ))}
        </div>
      )}

      {selectedFile && (
        <FileDetail
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          canEdit={selectedFile.uploaderId === currentUserId}
          canDelete={selectedFile.uploaderId === currentUserId || isAdmin}
          onUpdate={onUpdate}
          onDelete={onDelete}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
