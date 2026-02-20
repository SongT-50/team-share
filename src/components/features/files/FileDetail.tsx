'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { SharedFile } from '@/types';

interface FileDetailProps {
  file: SharedFile;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
  onUpdate: (fileId: string, data: Partial<SharedFile>) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function FileDetail({
  file,
  onClose,
  canEdit,
  canDelete,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: FileDetailProps) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(file.title);
  const [editDescription, setEditDescription] = useState(file.description || '');
  const [editTags, setEditTags] = useState(file.tags.join(', '));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    try {
      const parsedTags = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onUpdate(file._id, {
        title: editTitle,
        description: editDescription,
        tags: parsedTags,
      });
      toast.success('파일 정보가 수정되었습니다');
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 정보 수정에 실패했습니다';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(file._id);
      toast.success('파일이 삭제되었습니다');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 삭제에 실패했습니다';
      toast.error(message);
    }
  };

  // Delete confirmation modal
  if (showDeleteConfirm) {
    return (
      <Modal isOpen={true} onClose={() => setShowDeleteConfirm(false)} title="파일 삭제">
        <p className="text-sm text-gray-600 mb-1">
          &quot;{file.title}&quot;을 삭제하시겠습니까?
        </p>
        <p className="text-sm text-gray-500 mb-4">이 작업은 되돌릴 수 없습니다.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
            취소
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>
            삭제하기
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? '파일 수정' : file.title}>
      <div className="space-y-4">
        {/* Action buttons */}
        {!isEditing && (canEdit || canDelete) && (
          <div className="flex gap-2 justify-end">
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                수정
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                삭제
              </Button>
            )}
          </div>
        )}

        {/* Image preview */}
        {file.fileType === 'image' && (
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <img src={file.fileUrl} alt={file.title} className="w-full object-contain max-h-80" />
          </div>
        )}

        {isEditing ? (
          /* Edit mode */
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500 block mb-1">제목</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">설명</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">태그 (콤마로 구분)</label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="회의록, 2월"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isUpdating}>
                저장
              </Button>
            </div>
          </div>
        ) : (
          /* View mode */
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">파일명</span>
                <span>{file.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">크기</span>
                <span>{formatFileSize(file.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">업로더</span>
                <span>{file.uploaderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">업로드 일시</span>
                <span>{formatDate(file.createdAt)}</span>
              </div>
              {file.tags.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">태그</span>
                  <span>{file.tags.join(' | ')}</span>
                </div>
              )}
              {file.description && (
                <div>
                  <span className="text-gray-500 block mb-1">설명</span>
                  <p className="text-gray-700">{file.description}</p>
                </div>
              )}
            </div>

            <a
              href={file.fileUrl}
              download={file.fileName}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full">다운로드</Button>
            </a>
          </>
        )}
      </div>
    </Modal>
  );
}
