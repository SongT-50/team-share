'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file', fileUrl?: string) => Promise<unknown>;
  onSendFile: (file: File) => Promise<unknown>;
}

export function MessageInput({ onSendMessage, onSendFile }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleSend = async () => {
    if (!content.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(content);
      setContent('');
    } catch {
      toast.error('메시지 전송에 실패했습니다');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      await onSendFile(file);
    } catch {
      toast.error('파일 업로드에 실패했습니다');
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t bg-white p-3">
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 text-lg"
          title="파일 첨부"
        >
          📎
        </button>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isSending || !content.trim()}
          className="p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-300 text-lg"
          title="전송"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
