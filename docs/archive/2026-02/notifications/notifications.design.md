# notifications Design Document

> **Project**: team-share
> **Feature**: notifications (알림 시스템)
> **PDCA Cycle**: #7
> **Date**: 2026-02-20
> **Author**: Claude (AI)
> **Ref**: `docs/01-plan/features/notifications.plan.md`

---

## 1. Overview

마지막 기능인 알림 시스템을 구현한다. bkend.ai `notifications` 컬렉션 기반의 인앱 알림으로, 10초 polling 패턴 + Zustand 로컬 설정 + 알림 자동 생성을 제공한다.

---

## 2. Type Definition (NF-01)

### 2.1 `src/types/index.ts` — 추가할 타입

```typescript
// Notification types
export type NotificationType = 'chat' | 'file' | 'action' | 'team' | 'deadline';

export interface Notification extends BaseDocument {
  teamId: string;
  recipientId: string;        // 수신자 userId
  type: NotificationType;
  title: string;              // "김태은님이 메시지를 보냈습니다"
  body: string;               // 메시지 미리보기 또는 상세
  link?: string;              // 클릭 시 이동 경로 (/chat, /files, /actions)
  isRead: boolean;
  sourceId?: string;          // 원본 ID (messageId, fileId, actionId)
}
```

**변경 사항**: 파일 끝에 `NotificationType`, `Notification` 추가. 기존 6개 타입에 영향 없음.

---

## 3. Notification Settings Store (NF-07)

### 3.1 `src/stores/notification-store.ts` — 신규

Zustand + `persist` 미들웨어로 localStorage에 설정 저장.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettings {
  chat: boolean;     // 채팅 알림 (기본: true)
  file: boolean;     // 파일 알림 (기본: true)
  action: boolean;   // 액션 알림 (기본: true)
}

interface NotificationStore {
  settings: NotificationSettings;
  toggleSetting: (key: keyof NotificationSettings) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      settings: { chat: true, file: true, action: true },
      toggleSetting: (key) =>
        set((state) => ({
          settings: { ...state.settings, [key]: !state.settings[key] },
        })),
    }),
    { name: 'notification-settings' }
  )
);
```

**Props/State**:
- `settings`: `{ chat: boolean, file: boolean, action: boolean }` — 각 카테고리 ON/OFF
- `toggleSetting(key)`: 해당 카테고리 토글

---

## 4. useNotifications Hook (NF-02, NF-03)

### 4.1 `src/hooks/useNotifications.ts` — 신규

useChat 패턴 기반 (useState + polling). TanStack Query 대신 useChat과 동일한 직접 polling 패턴 사용 (일관성).

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { bkend } from '@/lib/bkend';
import { useAuth } from './useAuth';
import type { Notification, NotificationType } from '@/types';

export function useNotifications(teamId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const failCountRef = useRef(0);
  const { user } = useAuth();

  // 알림 조회 (polling)
  const loadNotifications = useCallback(async () => {
    if (!teamId || !user) return;
    try {
      const data = await bkend.collection('notifications').find({
        teamId,
        recipientId: user._id,
        sort: '-createdAt',       // 최신 먼저
      }) as Notification[];
      setNotifications(Array.isArray(data) ? data : []);
      failCountRef.current = 0;
      setIsError(false);
    } catch {
      failCountRef.current += 1;
      if (failCountRef.current >= 3) setIsError(false);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, user]);

  // 10초 polling
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // 단일 읽음 처리
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await bkend.collection('notifications').update(id, { isRead: true });
    } catch { /* optimistic — 실패해도 UI 유지 */ }
  }, []);

  // 전체 읽음 처리
  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await Promise.allSettled(
      unread.map((n) =>
        bkend.collection('notifications').update(n._id, { isRead: true })
      )
    );
  }, [notifications]);

  // 안 읽은 수
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    isLoading,
    isError,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
```

### 4.2 createNotification 유틸리티 (NF-03)

같은 파일 하단에 export:

```typescript
export async function createNotification(params: {
  teamId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  sourceId?: string;
}): Promise<void> {
  try {
    await bkend.collection('notifications').create({
      ...params,
      isRead: false,
    });
  } catch {
    // 알림 생성 실패는 무시 (주 기능에 영향 주지 않음)
  }
}
```

**설계 의도**: hook 내부가 아닌 독립 함수로 export하여, 어떤 컴포넌트에서도 import해 호출 가능. hook 의존성 최소화.

---

## 5. NotificationList Component (NF-04)

### 5.1 `src/components/features/notifications/NotificationList.tsx` — 신규

```
┌──────────────────────────────────────────────────┐
│ 🔔 알림 아이콘  제목                    2분 전    │
│                 본문 미리보기...                   │
│           (안읽음: bg-blue-50, 읽음: bg-white)    │
├──────────────────────────────────────────────────┤
│ 📁 파일 아이콘  제목                    1시간 전  │
│                 본문 미리보기...                   │
└──────────────────────────────────────────────────┘
```

**Props**:
```typescript
interface NotificationListProps {
  notifications: Notification[];
  onRead: (id: string) => void;
}
```

**구현 상세**:
- 알림 타입별 아이콘: `{ chat: '💬', file: '📁', action: '📌', team: '👥', deadline: '⏰' }`
- 읽음/안읽음 구분: 안읽음 → `bg-blue-50 border-l-2 border-blue-500`, 읽음 → `bg-white`
- 시간 표시: ActivityFeed의 `formatRelativeTime` 패턴 재사용 (로컬 헬퍼로 동일 구현)
- `link`가 있으면 클릭 시 `router.push(link)` + 읽음 처리
- 빈 상태: "알림이 없습니다" 텍스트

**시간 포맷 함수** (NotificationList 내 로컬):
```typescript
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
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}
```

---

## 6. Notifications Page (NF-05)

### 6.1 `src/app/(main)/notifications/page.tsx` — 신규

```
┌─────────────────────────────────────────────────────┐
│  🔔 알림                          [모두 읽음 처리]  │
│                                                     │
│  [전체] [안읽음 (3)]                                │
│                                                     │
│  ┌─ NotificationList ──────────────────────────┐    │
│  │  알림 카드 1                                │    │
│  │  알림 카드 2                                │    │
│  │  알림 카드 3                                │    │
│  │  ...                                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  에러 시: "알림을 불러오지 못했습니다" + 다시 시도   │
└─────────────────────────────────────────────────────┘
```

**State**:
```typescript
const [filter, setFilter] = useState<'all' | 'unread'>('all');
```

**로직**:
- `useNotifications(teamId)` 호출
- `filter === 'unread'` → `notifications.filter(n => !n.isRead)`
- "모두 읽음 처리" 버튼 → `markAllAsRead()` 호출
- 안읽음 탭에 Badge 카운트 표시: `안읽음 (${unreadCount})`
- 로딩: `<Spinner />`
- 에러: 에러 메시지 + `<Button>` 다시 시도 (`refresh`)
- 빈 상태: 필터별 다른 메시지 ("알림이 없습니다" / "안 읽은 알림이 없습니다")

---

## 7. Sidebar & MobileNav — NotificationBell (NF-06)

### 7.1 `src/components/features/layout/Sidebar.tsx` — 수정

**변경 내용**:
1. `useNotifications` import 추가
2. navItems에 알림 항목 추가:
```typescript
const navItems = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/chat', label: '채팅', icon: '💬' },
  { href: '/files', label: '자료', icon: '📁' },
  { href: '/actions', label: '액션', icon: '📌' },
  { href: '/notifications', label: '알림', icon: '🔔' },  // 추가
  { href: '/team', label: '팀', icon: '👥' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];
```
3. Badge 렌더링 조건 확장:
```typescript
{item.href === '/chat' && <Badge count={unreadCount} />}
{item.href === '/notifications' && <Badge count={notificationUnreadCount} />}
```
4. `useNotifications(teamId)` 호출하여 `unreadCount`를 `notificationUnreadCount`로 받음

### 7.2 `src/components/features/layout/MobileNav.tsx` — 수정

Sidebar와 동일한 변경:
1. `useNotifications` import
2. navItems에 알림 항목 추가 (동일 위치)
3. `/notifications` 항목에 Badge 렌더링

---

## 8. Settings Page — Notification Toggles (NF-07)

### 8.1 `src/app/(main)/settings/page.tsx` — 수정

기존 "프로필" + "팀 정보" 섹션 아래에 "알림 설정" 섹션 추가:

```
┌──────────────────────────────────────────┐
│  🔔 알림 설정                            │
│                                          │
│  채팅 알림     새 메시지 수신 시    [ON]  │
│  파일 알림     새 파일 업로드 시    [ON]  │
│  액션 알림     액션 할당/변경 시    [OFF] │
└──────────────────────────────────────────┘
```

**구현**:
```typescript
import { useNotificationStore } from '@/stores/notification-store';

// 컴포넌트 내부
const { settings, toggleSetting } = useNotificationStore();

// 토글 UI
const settingItems = [
  { key: 'chat' as const, label: '채팅 알림', description: '새 메시지 수신 시 알림' },
  { key: 'file' as const, label: '파일 알림', description: '새 파일 업로드 시 알림' },
  { key: 'action' as const, label: '액션 알림', description: '액션 할당/상태 변경 시 알림' },
];
```

**토글 스타일**:
- ON: `bg-blue-600` 토글 (오른쪽)
- OFF: `bg-gray-300` 토글 (왼쪽)
- `<button role="switch" aria-checked={value}>` — 접근성

---

## 9. Notification Auto-Creation (NF-08, NF-09, NF-10)

### 9.1 채팅 메시지 알림 (NF-08)

**삽입 위치**: `src/components/features/chat/ChatRoom.tsx` — 메시지 전송 성공 후

```typescript
import { createNotification } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/stores/notification-store';

// sendMessage 호출 후 (onSubmit 핸들러)
const result = await sendMessage(content);
if (result) {
  // 팀원 전체에 알림 (발신자 제외) — settings 체크는 수신자 측에서
  members
    .filter((m) => m._id !== user._id)
    .forEach((m) => {
      createNotification({
        teamId,
        recipientId: m._id,
        type: 'chat',
        title: `${user.name}님이 메시지를 보냈습니다`,
        body: content.length > 50 ? content.slice(0, 50) + '...' : content,
        link: '/chat',
        sourceId: result._id,
      });
    });
}
```

**참고**: 알림 설정(chat ON/OFF)은 **수신자의 localStorage**에 저장되므로, 생성은 무조건 하고 표시 시 필터링하는 것은 복잡. 대신 **생성 시점에 설정 체크 불가** (다른 사용자의 설정을 모름). 따라서 알림은 항상 생성하고, 알림 설정은 "표시 필터"가 아닌 "내 기기에서 알림 생성 여부"로 동작.

**수정된 접근**: 알림 설정은 알림 생성을 제어하는 게 아니라, 표시를 제어하는 용도. 모든 알림은 생성되고, useNotifications에서 settings에 따라 필터링하여 표시.

### 9.2 파일 업로드 알림 (NF-09)

**삽입 위치**: `src/app/(main)/files/page.tsx` — 파일 업로드 성공 후 (onUploaded 콜백)

```typescript
import { createNotification } from '@/hooks/useNotifications';

// onUploaded 콜백에서
members
  .filter((m) => m._id !== user._id)
  .forEach((m) => {
    createNotification({
      teamId,
      recipientId: m._id,
      type: 'file',
      title: `${user.name}님이 파일을 업로드했습니다`,
      body: file.title,
      link: '/files',
    });
  });
```

### 9.3 액션 알당/상태 변경 알림 (NF-10)

**삽입 위치**: `src/components/features/actions/ActionDetail.tsx`

**액션 할당 시** (assigneeId 변경):
```typescript
createNotification({
  teamId,
  recipientId: newAssigneeId,
  type: 'action',
  title: `${user.name}님이 액션을 할당했습니다`,
  body: action.title,
  link: '/actions',
  sourceId: action._id,
});
```

**상태 변경 시** (status 변경):
```typescript
createNotification({
  teamId,
  recipientId: action.creatorId,
  type: 'action',
  title: `액션 상태가 변경되었습니다`,
  body: `${action.title} → ${statusLabels[newStatus]}`,
  link: '/actions',
  sourceId: action._id,
});
```

---

## 10. useNotifications — 설정 기반 필터링

알림 목록 반환 시 `useNotificationStore` settings를 적용:

```typescript
import { useNotificationStore } from '@/stores/notification-store';

// loadNotifications 결과를 settings로 필터링
const { settings } = useNotificationStore();

const filteredNotifications = notifications.filter((n) => {
  if (n.type === 'chat' && !settings.chat) return false;
  if (n.type === 'file' && !settings.file) return false;
  if (n.type === 'action' && !settings.action) return false;
  return true;  // team, deadline은 항상 표시
});

// unreadCount도 filtered 기준
const unreadCount = filteredNotifications.filter((n) => !n.isRead).length;
```

**반환값 조정**: `notifications` 대신 `filteredNotifications`를 반환.

---

## 11. Implementation Order

| Step | Task | Files | Depends |
|:----:|------|-------|:-------:|
| 1 | Notification 타입 추가 | `src/types/index.ts` | - |
| 2 | notification-store 생성 | `src/stores/notification-store.ts` | Step 1 |
| 3 | useNotifications hook + createNotification | `src/hooks/useNotifications.ts` | Step 1, 2 |
| 4 | NotificationList 컴포넌트 | `src/components/features/notifications/NotificationList.tsx` | Step 3 |
| 5 | /notifications 페이지 | `src/app/(main)/notifications/page.tsx` | Step 3, 4 |
| 6 | Sidebar + MobileNav 알림 벨 | `Sidebar.tsx`, `MobileNav.tsx` | Step 3 |
| 7 | Settings 알림 설정 토글 | `settings/page.tsx` | Step 2 |
| 8 | 알림 자동 생성 (ChatRoom, files page, ActionDetail) | 3개 파일 | Step 3 |
| 9 | 빌드 확인 | - | Step 1-8 |

---

## 12. Dependency Map

```
types/index.ts (NF-01)
  ↓
notification-store.ts (NF-07)
  ↓
useNotifications.ts (NF-02, NF-03)
  ├→ NotificationList.tsx (NF-04)
  │    ↓
  │  notifications/page.tsx (NF-05)
  ├→ Sidebar.tsx (NF-06)
  ├→ MobileNav.tsx (NF-06)
  ├→ settings/page.tsx (NF-07)
  ├→ ChatRoom.tsx (NF-08) — createNotification
  ├→ files/page.tsx (NF-09) — createNotification
  └→ ActionDetail.tsx (NF-10) — createNotification
```

---

## 13. Component Summary

| Component | Type | Props/State | Key Features |
|-----------|------|-------------|-------------|
| notification-store | Zustand | `settings`, `toggleSetting` | localStorage persist, 3 categories |
| useNotifications | Hook | `teamId` → `notifications, unreadCount, markAsRead, markAllAsRead` | 10s polling, settings filter, optimistic read |
| createNotification | Function | `params` → `Promise<void>` | Fire-and-forget, error 무시 |
| NotificationList | Component | `notifications, onRead` | 타입별 아이콘, 읽음 스타일, 시간 표시 |
| /notifications page | Page | filter state (`all`/`unread`) | 탭, 전체 읽음, 에러 핸들링 |
| Sidebar (수정) | Component | + `notificationUnreadCount` | navItems에 알림 추가, Badge |
| MobileNav (수정) | Component | + `notificationUnreadCount` | navItems에 알림 추가, Badge |
| settings (수정) | Page | + `useNotificationStore` | 3개 토글 섹션 추가 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Cycle #7 Design 작성 | Claude (AI) |
