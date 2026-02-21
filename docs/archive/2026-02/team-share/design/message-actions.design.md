# Message Actions Design Document

> **Summary**: 메시지 속성 변환 완성 — 액션 전용 페이지, 상세 편집, 담당자 배정, 기한 관리, 삭제, 필터/정렬
>
> **Project**: team-share
> **Feature**: message-actions
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **Planning Doc**: [message-actions.plan.md](../../01-plan/features/message-actions.plan.md)
> **PDCA Cycle**: #5

---

## 1. Overview

### 1.1 Design Goals

- **기존 코드 확장**: useActions hook + 신규 컴포넌트 3개, 기존 2개 파일 수정
- **전용 관리 페이지**: /actions 라우트에서 모든 액션 아이템을 탭/필터/정렬로 관리
- **상세 편집**: 제목, 내용, 태그, 기한, 담당자를 Modal에서 수정
- **3단계 상태 관리**: open → in_progress → done 전환 UI

### 1.2 Design Principles

- **기존 패턴 준수**: files/page.tsx의 검색/정렬, FileDetail의 편집/삭제 패턴 참고
- **Modal 기반 편집**: ActionDetail을 Modal로 구현 (별도 라우트 불필요)
- **useTeam members 활용**: 담당자 배정에 기존 members 배열 사용
- **ActionConverter 미수정**: 생성 전용으로 유지 (채팅에서의 변환 플로우 보존)

---

## 2. Architecture

### 2.1 Data Flow

```
[생성 Flow] (기존 유지)
채팅 MessageBubble → ActionConverter → bkend.create('action-items') → useActions 조회

[목록 조회 Flow] (기존 확장)
/actions 페이지 → useActions(teamId) → 탭별 필터 + 상태별 필터 + 정렬 → ActionList 렌더링

[편집 Flow] (신규)
ActionList 항목 클릭 → ActionDetail Modal → 편집 → useActions.updateAction → invalidate

[삭제 Flow] (신규)
ActionDetail 삭제 버튼 → 확인 다이얼로그 → useActions.deleteAction → invalidate

[상태 전환 Flow] (확장)
ActionList 상태 드롭다운 → useActions.updateStatus → invalidate

[담당자 배정 Flow] (신규)
ActionDetail 담당자 드롭다운 → useTeam.members → useActions.updateAction(assigneeId) → invalidate
```

### 2.2 Component Diagram

```
┌───────────────────────────────────────────────────────┐
│  /actions (ActionsPage)                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │  헤더: 제목 + 카운트                               │ │
│  ├───────────────────────────────────────────────────┤ │
│  │  탭: [전체] [☑ 할일] [📋 의사결정] [💡 아이디어]   │ │
│  ├───────────────────────────────────────────────────┤ │
│  │  필터/정렬 바: 상태 필터 + 정렬 드롭다운           │ │
│  ├───────────────────────────────────────────────────┤ │
│  │  ActionList                                        │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │  ActionCard (액션 항목)                      │  │ │
│  │  │  - 타입 아이콘 + 제목                        │  │ │
│  │  │  - 상태 badge (open/진행중/완료)             │  │ │
│  │  │  - 담당자 이름 / 기한                        │  │ │
│  │  │  - 클릭 시 ActionDetail Modal 열림           │  │ │
│  │  ├─────────────────────────────────────────────┤  │ │
│  │  │  ActionCard                                  │  │ │
│  │  ├─────────────────────────────────────────────┤  │ │
│  │  │  ActionCard                                  │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ActionDetail (Modal)                        │
│  ┌─────────────────────────────────────────┐ │
│  │  타입 아이콘 + 타입 라벨                  │ │
│  ├─────────────────────────────────────────┤ │
│  │  제목 (편집 가능)                        │ │
│  │  내용 (편집 가능)                        │ │
│  │  태그 (콤마 구분 편집)                    │ │
│  │  기한 (date input)                       │ │
│  │  담당자 (멤버 드롭다운)                   │ │
│  │  상태 (3단계 드롭다운)                    │ │
│  ├─────────────────────────────────────────┤ │
│  │  [삭제]              [취소] [저장]        │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌──────────────────────┐   ┌──────────────────────┐
│  Sidebar (수정)       │   │  MobileNav (수정)     │
│  📊 대시보드          │   │  📊 💬 📁 📌 ⚙️     │
│  💬 채팅     [3]      │   │     📌 = 액션         │
│  📁 자료              │   │                       │
│  📌 액션              │   │                       │
│  👥 팀                │   │                       │
│  ⚙️ 설정              │   │                       │
└──────────────────────┘   └──────────────────────┘
```

---

## 3. Data Model

### 3.1 기존 타입 (변경 없음)

```typescript
// types/index.ts — 이미 존재, 수정 불필요
export type ActionType = 'todo' | 'decision' | 'idea';
export type ActionStatus = 'open' | 'in_progress' | 'done';

export interface ActionItem extends BaseDocument {
  teamId: string;
  sourceMessageId: string;
  creatorId: string;
  assigneeId?: string;
  actionType: ActionType;
  title: string;
  content: string;
  status: ActionStatus;
  dueDate?: string;
  tags: string[];
}
```

### 3.2 신규 타입

```typescript
// actions/page.tsx 내부 또는 ActionList에서 사용
export type ActionTab = 'all' | 'todo' | 'decision' | 'idea';
export type ActionSortOption = 'newest' | 'oldest' | 'dueDate' | 'status';
export type ActionStatusFilter = 'all' | 'open' | 'in_progress' | 'done';
```

---

## 4. API Specification

### 4.1 사용할 API

| Method | Endpoint | 용도 | 변경 |
|--------|----------|------|:----:|
| GET | `/collections/action-items?teamId=` | 액션 목록 조회 | 기존 |
| POST | `/collections/action-items` | 액션 생성 | 기존 (ActionConverter) |
| PUT | `/collections/action-items/:id` | 액션 수정 (상태, 제목, 내용, 태그, 기한, 담당자) | **확장** |
| DELETE | `/collections/action-items/:id` | 액션 삭제 | **신규** |

### 4.2 신규 API 상세

#### `PUT /collections/action-items/:id` (액션 수정 — 확장)

**Request (기존 status만 → 전체 필드 수정 가능):**
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "tags": ["tag1", "tag2"],
  "dueDate": "2026-02-28",
  "assigneeId": "user123",
  "status": "in_progress"
}
```

**Response (200):** 수정된 ActionItem 객체

#### `DELETE /collections/action-items/:id`

**Response (200):** `{ "deleted": true }`

---

## 5. UI/UX Design

### 5.1 ActionsPage

```
┌───────────────────────────────────────────────────┐
│  📌 액션 아이템                           12개     │
├───────────────────────────────────────────────────┤
│  [전체(12)] [☑ 할일(5)] [📋 의사결정(4)] [💡(3)]  │
├───────────────────────────────────────────────────┤
│  상태: [전체 ▼]                  정렬: [최신순 ▼]  │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ ☑ 회의 자료 준비하기                        │  │
│  │ 🟡 진행중  👤 태은  📅 2/25                 │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ ☑ API 문서 검토                             │  │
│  │ 🔵 열림    👤 미배정  📅 -                   │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 📋 Q1 목표 확정                             │  │
│  │ ✅ 완료    👤 김팀장  📅 2/20               │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 💡 마케팅 캠페인 아이디어                     │  │
│  │ 🔵 열림    👤 미배정  📅 -                   │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 5.2 ActionDetail Modal

```
┌─────────────────────────────────────────┐
│  ☑ 할일                          [🗑]  │
├─────────────────────────────────────────┤
│                                         │
│  제목                                   │
│  [회의 자료 준비하기               ]    │
│                                         │
│  내용                                   │
│  [내일 회의 시간에 필요한 자료를    ]    │
│  [정리해서 공유해주세요             ]    │
│                                         │
│  태그                                   │
│  [회의, 자료, 긴급                 ]    │
│                                         │
│  기한                                   │
│  [2026-02-25                       ]    │
│                                         │
│  담당자                                 │
│  [태은                           ▼]    │
│                                         │
│  상태                                   │
│  [진행중                         ▼]    │
│                                         │
│  ─────────────────────────────────────  │
│  메타 정보                               │
│  생성: 2026-02-20 | 출처: 채팅 메시지    │
│                                         │
├─────────────────────────────────────────┤
│  [삭제하기]           [취소] [저장하기]   │
└─────────────────────────────────────────┘
```

### 5.3 상태 Badge 색상

```
🔵 열림 (open)      → bg-blue-100 text-blue-700
🟡 진행중 (in_progress) → bg-yellow-100 text-yellow-700
✅ 완료 (done)      → bg-green-100 text-green-700
```

### 5.4 Sidebar 변경

```
기존:                    변경 후:
📊 대시보드              📊 대시보드
💬 채팅     [3]          💬 채팅     [3]
📁 자료                  📁 자료
👥 팀                    📌 액션          ← 추가
⚙️ 설정                  👥 팀
                         ⚙️ 설정
```

---

## 6. Component Specification

### 6.1 수정/생성 파일 목록

| Component | Location | 작업 | 변경 내용 |
|-----------|----------|:----:|----------|
| `useActions` | `src/hooks/useActions.ts` | **수정** | deleteAction, updateAction mutations, isError, refetch, isDeleting, isUpdating 추가 |
| `ActionList` | `src/components/features/actions/ActionList.tsx` | **생성** | 액션 목록, 상태 badge, 타입 아이콘, 담당자, 기한, 빈 상태 |
| `ActionDetail` | `src/components/features/actions/ActionDetail.tsx` | **생성** | Modal 기반 편집/삭제, 담당자 드롭다운, 기한 input, 상태 select |
| `ActionsPage` | `src/app/(main)/actions/page.tsx` | **생성** | 탭(전체/할일/의사결정/아이디어), 상태 필터, 정렬, 에러 UI |
| `Sidebar` | `src/components/features/layout/Sidebar.tsx` | **수정** | navItems에 액션 메뉴 추가 |
| `MobileNav` | `src/components/features/layout/MobileNav.tsx` | **수정** | navItems에 액션 메뉴 추가 |

### 6.2 useActions Hook (확장)

```typescript
interface UseActionsReturn {
  // 기존 (유지)
  actions: ActionItem[];
  todos: ActionItem[];
  decisions: ActionItem[];
  ideas: ActionItem[];
  openTodos: ActionItem[];
  doneTodos: ActionItem[];
  todoProgress: number;
  isLoading: boolean;
  updateStatus: (params: { id: string; status: ActionStatus }) => void;

  // 신규 추가
  isError: boolean;
  refetch: () => void;
  deleteAction: (actionId: string) => Promise<void>;
  updateAction: (actionId: string, data: Partial<ActionItem>) => Promise<void>;
  isDeleting: boolean;
  isUpdating: boolean;
}
```

**동작 상세:**
- `deleteAction(id)`: `bkend.collection('action-items').delete(id)` → invalidateQueries
- `updateAction(id, data)`: `bkend.collection('action-items').update(id, data)` → invalidateQueries
- `isError`: useQuery의 isError 노출
- `refetch`: useQuery의 refetch 노출

### 6.3 ActionList Props

```typescript
interface ActionListProps {
  actions: ActionItem[];
  isLoading: boolean;
  members: TeamMember[];
  onSelect: (action: ActionItem) => void;
  onStatusChange: (id: string, status: ActionStatus) => void;
}
```

**내부 구현:**
- 각 항목은 카드 형태로 렌더링
- 타입 아이콘 (☑/📋/💡) + 제목
- 상태 badge (색상: blue/yellow/green)
- 담당자 이름 (assigneeId → members에서 조회) 또는 "미배정"
- 기한 표시 (dueDate 있으면 MM/DD 형식)
- 빈 상태: "아직 액션 아이템이 없습니다. 채팅에서 메시지를 클릭하여 변환해보세요"
- 클릭 시 `onSelect(action)` 호출

### 6.4 ActionDetail Props

```typescript
interface ActionDetailProps {
  action: ActionItem;
  members: TeamMember[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (actionId: string, data: Partial<ActionItem>) => Promise<void>;
  onDelete: (actionId: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  canDelete: boolean;
}

// 내부 State:
// + editTitle: string
// + editContent: string
// + editTags: string (콤마 구분 문자열)
// + editDueDate: string
// + editAssigneeId: string
// + editStatus: ActionStatus
// + showDeleteConfirm: boolean
```

**동작 상세:**
- Modal 열릴 때 action props로 편집 상태 초기화
- 저장 시: 변경된 필드만 updateAction 호출
- 삭제: showDeleteConfirm → 2단계 확인 → deleteAction
- 메타 정보: 생성일, 출처 메시지 표시 (sourceMessageId)
- canDelete: `action.creatorId === user._id || isAdmin`

### 6.5 ActionsPage (신규)

```typescript
// 내부 State:
// + activeTab: ActionTab ('all' | 'todo' | 'decision' | 'idea')
// + statusFilter: ActionStatusFilter ('all' | 'open' | 'in_progress' | 'done')
// + sortBy: ActionSortOption ('newest' | 'oldest' | 'dueDate' | 'status')
// + selectedAction: ActionItem | null (ActionDetail Modal 표시용)
```

**필터 로직:**
```typescript
// 1. 탭 필터
const tabFiltered = activeTab === 'all'
  ? actions
  : actions.filter(a => a.actionType === activeTab);

// 2. 상태 필터
const statusFiltered = statusFilter === 'all'
  ? tabFiltered
  : tabFiltered.filter(a => a.status === statusFilter);

// 3. 정렬
const sorted = sortActions(statusFiltered, sortBy);
```

**정렬 함수:**
```typescript
function sortActions(items: ActionItem[], sortBy: ActionSortOption): ActionItem[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'dueDate': // dueDate 있는 것 우선, 없으면 뒤로
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'status': // open → in_progress → done 순서
        const order = { open: 0, in_progress: 1, done: 2 };
        return order[a.status] - order[b.status];
      default: return 0;
    }
  });
}
```

### 6.6 Sidebar / MobileNav (변경)

```typescript
// navItems 배열 변경 (기존 5개 → 6개)
const navItems = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/chat', label: '채팅', icon: '💬' },
  { href: '/files', label: '자료', icon: '📁' },
  { href: '/actions', label: '액션', icon: '📌' },   // ← 추가
  { href: '/team', label: '팀', icon: '👥' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];
```

---

## 7. Error Handling

| 상황 | 처리 |
|------|------|
| 액션 목록 조회 실패 | isError → "액션을 불러올 수 없습니다" + "다시 시도" 버튼 |
| 액션 수정 실패 | Toast "수정에 실패했습니다" |
| 액션 삭제 실패 | Toast "삭제에 실패했습니다" |
| 팀 멤버 로딩 중 | 담당자 드롭다운에 "로딩 중..." 옵션 표시 |

---

## 8. Security Considerations

- 삭제 권한: `action.creatorId === user._id || isAdmin` (생성자 또는 관리자)
- 수정 권한: 모든 팀 멤버 가능 (팀 협업 도구이므로)
- 담당자 배정: teamId 기반 멤버만 선택 가능
- 데이터 접근: teamId 기반 격리 (useActions에서 teamId 필터)

---

## 9. Implementation Order

```
Step 1: useActions.ts 확장 — deleteAction, updateAction, isError, refetch, isDeleting, isUpdating
Step 2: ActionList.tsx 생성 — 목록, 상태 badge, 타입 아이콘, 담당자, 기한, 빈 상태
Step 3: ActionDetail.tsx 생성 — Modal 기반 편집/삭제, 담당자/기한/상태/태그
Step 4: actions/page.tsx 생성 — 탭, 상태 필터, 정렬, 에러 UI, ActionDetail Modal 연동
Step 5: Sidebar.tsx + MobileNav.tsx — navItems에 액션 메뉴 추가
Step 6: 빌드 검증
```

---

## 10. Test Plan

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | /actions 페이지 진입 | 전체 탭 선택, 모든 액션 목록 표시 |
| 2 | 탭 전환 (할일 → 의사결정) | 해당 타입 액션만 필터링 |
| 3 | 상태 필터 (진행중) | 해당 상태 액션만 필터링 |
| 4 | 정렬 (기한순) | 기한 있는 항목 우선, 가까운 기한 먼저 |
| 5 | 액션 카드 클릭 | ActionDetail Modal 열림, 현재 값으로 초기화 |
| 6 | 제목/내용 편집 → 저장 | 수정 반영, Modal 닫힘 |
| 7 | 담당자 배정 → 저장 | 목록에 담당자 이름 표시 |
| 8 | 기한 설정 → 저장 | 목록에 기한 표시 |
| 9 | 상태 변경 (open → in_progress) | badge 색상 변경 |
| 10 | 삭제 버튼 → 확인 → 삭제 | 목록에서 제거 |
| 11 | Sidebar에 액션 메뉴 | 📌 액션 메뉴 표시, 클릭 시 /actions 이동 |
| 12 | 빈 상태 | 안내 메시지 표시 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial design — 4개 파일 수정 + 3개 신규, 6단계 구현 순서 | 태은 |
