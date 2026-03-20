import Link from 'next/link';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { SharedFile } from '@/types';

const fileIcons: Record<string, string> = {
  image: '🖼️',
  document: '📄',
  other: '📎',
};

interface RecentFilesProps {
  files: SharedFile[];
}

export function RecentFiles({ files }: RecentFilesProps) {
  const recent = files.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400 text-sm mb-2">
          아직 공유된 자료가 없습니다
        </p>
        <Link href="/files" className="text-sm text-blue-600 hover:text-blue-700">
          자료 업로드 &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {recent.map((file) => (
          <li key={file.id}>
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <span className="text-lg">{fileIcons[file.fileType] || '📎'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.title}</p>
                <p className="text-xs text-gray-400">
                  {file.uploaderName} · {formatFileSize(file.fileSize)} · {formatDate(file.createdAt)}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
      {files.length > 5 && (
        <div className="mt-3 text-right">
          <Link href="/files" className="text-sm text-blue-600 hover:text-blue-700">
            전체 보기 ({files.length}개) &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
