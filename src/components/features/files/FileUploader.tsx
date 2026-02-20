'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { bkend } from '@/lib/bkend';
import { useAuth } from '@/hooks/useAuth';
import { getFileType, formatFileSize } from '@/lib/utils';
import type { SharedFile } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileUploaderProps {
  teamId: string;
  onUploaded: (file: SharedFile) => void;
}

export function FileUploader({ teamId, onUploaded }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const toast = useToast();

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`파일 크기는 ${formatFileSize(MAX_FILE_SIZE)} 이하여야 합니다`);
      return;
    }
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const uploadResult = (await bkend.upload(selectedFile)) as { url: string };

      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const sharedFile = (await bkend.collection('shared-files').create({
        teamId,
        uploaderId: user._id,
        uploaderName: user.name,
        title: title || selectedFile.name,
        fileUrl: uploadResult.url,
        fileType: getFileType(selectedFile.name),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        tags: parsedTags,
      })) as SharedFile;

      toast.success('파일이 업로드되었습니다');
      onUploaded(sharedFile);
      setSelectedFile(null);
      setTitle('');
      setTags('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      const message = error instanceof Error ? error.message : '업로드에 실패했습니다';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setTitle('');
    setTags('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.avi,.mov"
      />

      {!selectedFile ? (
        <div>
          <p className="text-gray-500 mb-3">
            {isDragging ? '여기에 놓으면 업로드됩니다' : '파일을 여기에 끌어다 놓거나 선택하세요'}
          </p>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            파일 선택
          </Button>
          <p className="text-xs text-gray-400 mt-2">최대 10MB</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
          <input
            type="text"
            placeholder="제목 (선택)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="태그 (콤마로 구분, 예: 회의록, 2월)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <div className="flex gap-2 justify-center">
            <Button onClick={handleUpload} isLoading={isUploading}>
              업로드
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
