# Chat Design Document

> **Summary**: 실시간 채팅 기능 완성 — 메시지 삭제, 읽음 표시, 안 읽은 수, 날짜 구분, 검색, 에러 처리
>
> **Project**: team-share
> **Feature**: chat
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **Planning Doc**: [chat.plan.md](../../01-plan/features/chat.plan.md)
> **PDCA Cycle**: #4

---

## 1. Overview

### 1.1 Design Goals

- **기존 코드 확장**: 6개 기존 파일을 수정, 신규 파일 최소화
- **읽음/안 읽음 UX**: readBy 필드 활용하여 읽음 표시 + Sidebar badge
- **메시지 관리**: 본인 메시지 삭제, 검색 기능 추가
- **시각적 개선**: 날짜 구분선, 스크롤 하단 이동 버튼

### 1.2 Design Principles

- **폴링 유지**: 기존 5초 폴링 구조 위에 기능 추가 (WebSocket은 v2)
- **낙관적 업데이트**: 삭제 시 로컬 상태 즉시 반영 후 서버 동기화
- **클라이언트 사이드 검색**: 현재 메시지 규모(100개 이하)에 적합

---

## 2. Architecture

### 2.1 Data Flow

```
[읽음 표시 Flow] (신규)
채팅방 진입 → useChat.markAsRead() → bkend.update(readBy 추가) → 폴링으로 타인에게 반영

[삭제 Flow] (신규)
삭제 버튼 → 확인 다이얼로그 → useChat.deleteMessage() → 로컬 즉시 제거 + bkend.delete

[안 읽은 수 Flow] (신규)
useChat.unreadCount → Sidebar/MobileNav Badge 컴포넌트 렌더링

[검색 Flow] (신규)
검색어 입력 → 클라이언트 필터 → ChatRoom 렌더링 (하이라이트 없음, 필터만)

[날짜 구분 Flow] (신규)
메시지 렌더링 시 이전 메시지와 날짜 비교 → 변경 시 구분선 삽입
```

### 2.2 Component Diagram

```
┌───────────────────────────────────────────────────────┐
│  /chat (ChatPage)                                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │  헤더: 팀명 + 멤버 수                              │ │
│  ├───────────────────────────────────────────────────┤ │
│  │  검색바 (토글)                                     │ │
│  ├───────────────────────────────────────────────────┤ │
│  │  ChatRoom (수정)                                   │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │  ── 2026년 2월 19일 ──  (날짜 구분선)       │  │ │
│  │  │  MessageBubble (수정)                        │  │ │
│  │  │  - 읽음 N명 표시                             │  │ │
│  │  │  - 삭제 버튼 (본인 메시지)                    │  │ │
│  │  │  ── 2026년 2월 20일 ──  (날짜 구분선)       │  │ │
│  │  │  MessageBubble                               │  │ │
│  │  │  MessageBubble                               │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │  [↓ 새 메시지] (스크롤 하단 이동 버튼)            │ │
│  ├───────────────────────────────────────────────────┤ │
│  │  MessageInput (기존 유지)                          │ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘

┌──────────────────────┐   ┌──────────────────────┐
│  Sidebar (수정)       │   │  MobileNav (수정)     │
│  💬 채팅 [3]          │   │  💬 [3]               │
│  (Badge 컴포넌트)     │   │  (Badge 컴포넌트)     │
└──────────────────────┘   └──────────────────────┘
```

---

## 3. Data Model

### 3.1 기존 타입 (변경 없음)

```typescript
// types/index.ts — 이미 존재, 수정 불필요
interface ChatMessage extends BaseDocument {
  teamId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  readBy: string[];
}
```

### 3.2 신규 타입 (없음)

기존 `ChatMessage`의 `readBy: string[]` 필드를 그대로 활용하므로 추가 타입 불필요.

---

## 4. API Specification

### 4.1 사용할 API

| Method | Endpoint | 용도 | 변경 |
|--------|----------|------|:----:|
| GET | `/collections/chat-messages?teamId=` | 메시지 목록 조회 | 기존 |
| POST | `/collections/chat-messages` | 메시지 전송 | 기존 |
| PUT | `/collections/chat-messages/:id` | readBy 업데이트 | **신규** |
| DELETE | `/collections/chat-messages/:id` | 메시지 삭제 | **신규** |

### 4.2 신규 API 상세

#### `PUT /collections/chat-messages/:id` (readBy 업데이트)

**Request:**
```json
{
  "readBy": ["userId1", "userId2", "userId3"]
}
```

**Response (200):** 수정된 ChatMessage 객체

#### `DELETE /collections/chat-messages/:id`

**Response (200):** `{ "deleted": true }`

---

## 5. UI/UX Design

### 5.1 ChatRoom (확장)

```
┌───────────────────────────────────────────┐
│  💬 우리팀 채팅                    3명     │
│  [🔍]                                     │
├───────────────────────────────────────────┤
│  (검색 모드 시)                            │
│  [메시지 검색...                        ] │
├───────────────────────────────────────────┤
│                                           │
│  ─── 2026년 2월 19일 (수) ───            │
│                                           │
│  👤 태은                                  │
│  ┌─────────────────────────┐              │
│  │ 내일 회의 시간 알려주세요  │              │
│  └─────────────────────────┘              │
│  오후 3:30  읽음 2                        │
│                                           │
│  ─── 2026년 2월 20일 (목) ───            │
│                                           │
│              ┌─────────────────────────┐  │
│              │ 오전 10시에 합시다      [🗑]│  │
│              └─────────────────────────┘  │
│                         읽음 3  오후 2:15 │
│                                           │
│  👤 박팀원                                │
│  ┌─────────────────────────┐              │
│  │ 네 알겠습니다!            │              │
│  └─────────────────────────┘              │
│  오후 2:16                                │
│                                           │
│                         [↓ 새 메시지]     │
├───────────────────────────────────────────┤
│  📎 [메시지를 입력하세요...          ] ➤  │
└───────────────────────────────────────────┘
```

### 5.2 메시지 삭제 확인

```
┌─────────────────────────────┐
│  메시지 삭제                 │
│                             │
│  이 메시지를 삭제하시겠습니까? │
│  삭제된 메시지는 복구할 수    │
│  없습니다.                   │
│                             │
│  [취소]          [삭제하기]   │
└─────────────────────────────┘
```

### 5.3 Sidebar Badge

```
┌──────────────────────┐
│  Team Share           │
├──────────────────────┤
│  📊 대시보드          │
│  💬 채팅     ⬤3      │  ← Badge (빨간 원, 안 읽은 수)
│  📁 자료              │
│  👥 팀                │
│  ⚙️ 설정              │
└──────────────────────┘
```

### 5.4 스크롤 하단 이동 버튼

```
┌───────────────────────────────────────────┐
│  (메시지들...)                             │
│                                           │
│                    ┌─────────────┐        │
│                    │ ↓ 새 메시지  │        │
│                    └─────────────┘        │
├───────────────────────────────────────────┤
│  📎 [메시지를 입력하세요...          ] ➤  │
└───────────────────────────────────────────┘
```

사용자가 스크롤을 위로 올렸을 때만 표시. 클릭 시 최하단으로 smooth scroll.

---

## 6. Component Specification

### 6.1 수정할 파일 목록

| Component | Location | 변경 내용 |
|-----------|----------|----------|
| `useChat` | `src/hooks/useChat.ts` | deleteMessage, markAsRead, isError, unreadCount 추가 |
| `ChatRoom` | `src/components/features/chat/ChatRoom.tsx` | 날짜 구분선, 검색 필터, 스크롤 개선, 에러 전달 |
| `MessageBubble` | `src/components/features/chat/MessageBubble.tsx` | 삭제 버튼, 읽음 표시 UI 추가 |
| `ChatPage` | `src/app/(main)/chat/page.tsx` | 검색 상태, 에러 UI 추가 |
| `Sidebar` | `src/components/features/layout/Sidebar.tsx` | 채팅 메뉴에 unread Badge |
| `MobileNav` | `src/components/features/layout/MobileNav.tsx` | 채팅 메뉴에 unread Badge |

### 6.2 useChat Hook (확장)

```typescript
interface UseChatReturn {
  // 기존 (유지)
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file', fileUrl?: string) => Promise<ChatMessage | null>;
  sendFile: (file: File) => Promise<ChatMessage | null>;
  refresh: () => void;

  // 신규 추가
  isError: boolean;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  unreadCount: number;
}
```

**동작 상세:**
- `deleteMessage(id)`: 로컬 messages에서 즉시 제거 + bkend.delete 호출
- `markAsRead()`: 현재 messages 중 readBy에 user._id 없는 것들을 일괄 PUT
- `unreadCount`: messages에서 `!msg.readBy.includes(user._id)` 카운트
- `isError`: 폴링 실패 시 true (연속 3회 실패 후)

### 6.3 ChatRoom Props (변경)

```typescript
interface ChatRoomProps {
  teamId: string;        // 기존
  searchQuery: string;   // 신규: 외부에서 전달받는 검색어
}
```

**내부 State 추가:**
- `showScrollButton: boolean` — 스크롤이 하단에서 벗어났을 때 true

### 6.4 MessageBubble Props (변경)

```typescript
interface MessageBubbleProps {
  message: ChatMessage;     // 기존
  isMine: boolean;          // 기존
  teamId: string;           // 기존
  onDelete: (messageId: string) => void;  // 신규
  isDeleting: boolean;      // 신규
  memberCount: number;      // 신규: 전체 멤버 수 (읽음 N/전체 표시용)
}

// 내부 State 추가:
// + showDeleteConfirm: boolean
```

### 6.5 ChatPage (확장)

```typescript
// 내부 State 추가:
// + showSearch: boolean — 검색바 토글
// + searchInput: string — 검색 입력값
// + searchQuery: string — debounce된 검색어 (300ms)
```

### 6.6 Sidebar / MobileNav (변경)

```typescript
// Sidebar: navItems를 동적으로 만들고, 채팅 항목에 Badge 추가
// unreadCount는 useChat(teamId)에서 가져옴

// 변경 방식: navItems를 컴포넌트 내부로 이동하고
// 채팅 항목 옆에 <Badge count={unreadCount} /> 렌더링
```

---

## 7. Error Handling

| 상황 | 처리 |
|------|------|
| 메시지 목록 조회 실패 (폴링) | 연속 3회 실패 시 isError=true, "메시지를 불러올 수 없습니다" + "다시 시도" 버튼 |
| 메시지 전송 실패 | "메시지 전송에 실패했습니다" Toast (기존) |
| 메시지 삭제 실패 | "메시지 삭제에 실패했습니다" Toast, 로컬 상태 롤백 |
| readBy 업데이트 실패 | 무시 (다음 폴링에서 재시도) |

---

## 8. Security Considerations

- 삭제 권한: `message.senderId === user._id` (본인 메시지만)
- readBy 업데이트: 자신의 ID만 추가 가능 (서버 사이드 검증은 bkend.ai)
- 메시지 접근: teamId 기반 격리

---

## 9. Implementation Order

```
Step 1: useChat.ts 확장 — deleteMessage, markAsRead, isError, unreadCount
Step 2: MessageBubble.tsx 수정 — 삭제 버튼 + 확인, 읽음 표시 UI
Step 3: ChatRoom.tsx 수정 — 날짜 구분선, 검색 필터, 스크롤 버튼
Step 4: chat/page.tsx 수정 — 검색 상태, 에러 UI
Step 5: Sidebar.tsx + MobileNav.tsx — unread Badge
Step 6: 빌드 검증
```

---

## 10. Test Plan

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | 채팅방 진입 | 기존 메시지 readBy에 내 ID 추가됨 |
| 2 | 본인 메시지 삭제 | 확인 후 메시지 즉시 사라짐 |
| 3 | 타인 메시지 삭제 시도 | 삭제 버튼 없음 |
| 4 | 읽음 표시 | "읽음 2" 형태로 표시 |
| 5 | 안 읽은 메시지 | Sidebar에 빨간 Badge 표시 |
| 6 | 날짜 구분선 | 날짜 변경 시 "2026년 2월 20일 (목)" 구분선 |
| 7 | 메시지 검색 | 입력 텍스트와 일치하는 메시지만 표시 |
| 8 | 에러 상태 | "다시 시도" 버튼 표시 |
| 9 | 스크롤 상단 이동 | "새 메시지" 버튼 표시, 클릭 시 하단으로 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial design — 6개 파일 수정 설계 | 태은 |
