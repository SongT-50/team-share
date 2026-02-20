import { formatDate, formatFileSize } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { SharedFile } from '@/types';

const fileIcons: Record<string, string> = {
  image: '🖼️',
  document: '📄',
  video: '🎬',
  other: '📎',
};

interface FileCardProps {
  file: SharedFile;
  onClick: () => void;
}

export function FileCard({ file, onClick }: FileCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{fileIcons[file.fileType] || '📎'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{file.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {file.fileName} · {formatFileSize(file.fileSize)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Avatar name={file.uploaderName} size="sm" />
            <span className="text-xs text-gray-500">
              {file.uploaderName} · {formatDate(file.createdAt)}
            </span>
          </div>
        </div>
      </div>
      {file.tags.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap">
          {file.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
