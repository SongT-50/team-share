'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { ActionConverter } from './ActionConverter';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  teamId: string;
  onDelete: (messageId: string) => void;
  isDeleting: boolean;
  memberCount: number;
}

export function MessageBubble({
  message,
  isMine,
  teamId,
  onDelete,
  isDeleting,
  memberCount,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const readCount = message.readBy.length;

  return (
    <>
      <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
        {!isMine && <Avatar name={message.senderName} size="sm" />}

        <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
          {!isMine && (
            <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
          )}

          <div className="relative group">
            <div
              className={`rounded-2xl px-4 py-2 cursor-pointer ${
                isMine
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-900 rounded-tl-sm'
              }`}
              onClick={() => setShowActions(!showActions)}
            >
              {message.type === 'text' && <p className="text-sm">{message.content}</p>}
              {message.type === 'image' && message.fileUrl && (
                <img src={message.fileUrl} alt="이미지" className="rounded-lg max-w-full max-h-48" />
              )}
              {message.type === 'file' && message.fileUrl && (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  📎 {message.content}
                </a>
              )}
            </div>

            {/* Delete button — only for own messages */}
            {isMine && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-sm"
                title="삭제"
              >
                🗑
              </button>
            )}
          </div>

          {/* Time + read count */}
          <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : ''}`}>
            {readCount > 1 && (
              <span className="text-xs text-gray-400">
                읽음 {readCount}{memberCount > 0 ? `/${memberCount}` : ''}
              </span>
            )}
            <span className="text-xs text-gray-400">{formatDate(message.createdAt)}</span>
          </div>

          {showActions && (
            <ActionConverter
              message={message}
              teamId={teamId}
              onClose={() => setShowActions(false)}
            />
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(false)}
          title="메시지 삭제"
        >
          <p className="text-sm text-gray-600 mb-1">
            이 메시지를 삭제하시겠습니까?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            삭제된 메시지는 복구할 수 없습니다.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(message._id);
                setShowDeleteConfirm(false);
              }}
              isLoading={isDeleting}
            >
              삭제하기
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
