import type { ChatMessage, SharedFile, ActionItem } from '@/types';

interface FeedItem {
  id: string;
  type: 'chat' | 'file' | 'action';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

const fileIcons: Record<string, string> = {
  image: '🖼️',
  document: '📄',
  video: '🎬',
  other: '📎',
};

const actionTypeIcons: Record<string, string> = {
  todo: '☑',
  decision: '📋',
  idea: '💡',
};

const statusLabels: Record<string, string> = {
  open: '열림',
  in_progress: '진행중',
  done: '완료',
};

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

interface ActivityFeedProps {
  messages: ChatMessage[];
  files: SharedFile[];
  actions: ActionItem[];
}

export function ActivityFeed({ messages, files, actions }: ActivityFeedProps) {
  const chatFeed: FeedItem[] = messages.map((msg) => ({
    id: `chat-${msg.id}`,
    type: 'chat',
    title: msg.senderName,
    description: msg.content.length > 30 ? msg.content.slice(0, 30) + '...' : msg.content,
    timestamp: msg.createdAt,
    icon: '💬',
  }));

  const fileFeed: FeedItem[] = files.map((file) => ({
    id: `file-${file.id}`,
    type: 'file',
    title: file.title,
    description: `${file.uploaderName} 업로드`,
    timestamp: file.createdAt,
    icon: fileIcons[file.fileType] || '📎',
  }));

  const actionFeed: FeedItem[] = actions.map((action) => ({
    id: `action-${action.id}`,
    type: 'action',
    title: action.title,
    description: `${actionTypeIcons[action.actionType] || ''} ${statusLabels[action.status] || action.status}`,
    timestamp: action.createdAt,
    icon: actionTypeIcons[action.actionType] || '📌',
  }));

  const feedItems = [...chatFeed, ...fileFeed, ...actionFeed]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  if (feedItems.length === 0) {
    return (
      <p className="text-center text-gray-400 py-6 text-sm">
        아직 활동이 없습니다
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {feedItems.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-3">
          <span className="text-lg">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-xs text-gray-500 truncate">{item.description}</p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatRelativeTime(item.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}
