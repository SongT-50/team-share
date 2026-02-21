# dashboard Design Document

> **Project**: team-share
> **Feature**: dashboard (대시보드 — 활동 요약, 진행률, 통계)
> **PDCA Cycle**: #6
> **Date**: 2026-02-20
> **Plan Reference**: [dashboard.plan.md](../../01-plan/features/dashboard.plan.md)

---

## 1. Overview

기존 대시보드(4 StatCard + TodoList + RecentFiles)를 5개 완성된 기능의 데이터를 종합한 팀 활동 허브로 개선한다. 채팅 데이터(useChat) 추가 활용, 프로그레스 바, 활동 피드, 기한 관리, 빠른 액션을 통해 팀 현황을 한눈에 파악할 수 있도록 한다.

---

## 2. Data Model

### 2.1 FeedItem (ActivityFeed 전용, 컴포넌트 내부 타입)

```typescript
interface FeedItem {
  id: string;
  type: 'chat' | 'file' | 'action';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}
```

### 2.2 기존 타입 활용 (변경 없음)

| Type | Hook | 사용 위치 |
|------|------|----------|
| `ActionItem` | useActions | TodoList, UpcomingDeadlines, DashboardStats |
| `SharedFile` | useFiles | RecentFiles, DashboardStats, ActivityFeed |
| `ChatMessage` | useChat | ActivityFeed, DashboardStats |
| `TeamMember` | useTeam | DashboardStats, TodoList |

---

## 3. Hook Usage (신규 hook 없음)

DashboardPage에서 기존 5개 hook을 조합하여 모든 데이터를 공급한다.

```typescript
// page.tsx
const { user } = useAuth();
const { currentTeam, teamId, members, isLoading: teamLoading } = useTeam();
const { files } = useFiles(teamId);
const { actions, todos, decisions, ideas, openTodos, doneTodos, todoProgress, updateStatus } = useActions(teamId);
const { messages, unreadCount } = useChat(teamId);
```

---

## 4. Component Specifications

### 4.1 DashboardStats (수정 — DB-01)

**File**: `src/components/features/dashboard/DashboardStats.tsx`

**변경 사항**:
- StatCard에 프로그레스 바 옵션 추가
- 각 StatCard를 Link로 래핑 (클릭 시 해당 페이지 이동)
- 멤버 수 StatCard 추가 (5개 → 총 5개 카드)
- 안 읽은 메시지 StatCard 추가 → 총 6개 카드 (3열×2행)

**Props (변경)**:

```typescript
interface DashboardStatsProps {
  todoCount: { done: number; total: number };
  fileCount: number;
  decisionCount: number;
  ideaCount: number;
  memberCount: number;
  unreadCount: number;
}
```

**StatCard 변경**:

```typescript
interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  href: string;           // 신규: 클릭 시 이동 경로
  progress?: number;      // 신규: 0-100 프로그레스 바 (optional)
  color?: string;         // 신규: 프로그레스 바 색상 (Tailwind class)
}
```

**6개 카드 배열**:

| # | icon | label | value | sub | href | progress | color |
|---|------|-------|-------|-----|------|----------|-------|
| 1 | ☑ | 할일 | `{done}/{total}` | `{progress}%` | /actions | todoProgress | blue |
| 2 | 📁 | 자료 | fileCount | — | /files | — | — |
| 3 | 📋 | 의사결정 | decisionCount | — | /actions | — | — |
| 4 | 💡 | 아이디어 | ideaCount | — | /actions | — | — |
| 5 | 👥 | 멤버 | memberCount | — | /team | — | — |
| 6 | 💬 | 안 읽은 메시지 | unreadCount | — | /chat | — | — |

**레이아웃**: `grid grid-cols-2 lg:grid-cols-3 gap-3` (기존 4열 → 3열×2행)

**프로그레스 바 UI**:

```
┌─────────────────────────┐
│ ☑ 할일                   │
│ 3/5                      │
│ ████████░░░░░░░░░ 60%   │
└─────────────────────────┘
```

프로그레스 바 구현:
```html
<div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
</div>
```

---

### 4.2 ActivityFeed (신규 — DB-02)

**File**: `src/components/features/dashboard/ActivityFeed.tsx`

**Props**:

```typescript
interface ActivityFeedProps {
  messages: ChatMessage[];
  files: SharedFile[];
  actions: ActionItem[];
}
```

**내부 로직**:

1. 3개 소스를 FeedItem으로 변환:
   - ChatMessage → `{ type: 'chat', icon: '💬', title: senderName, description: content (30자 truncate), timestamp: createdAt }`
   - SharedFile → `{ type: 'file', icon: fileIcons[fileType], title: title, description: uploaderName + ' 업로드', timestamp: createdAt }`
   - ActionItem → `{ type: 'action', icon: typeIcons[actionType], title: title, description: statusLabels[status], timestamp: createdAt }`

2. 병합 → `createdAt` 내림차순 정렬 → 최근 10건 slice

3. `formatRelativeTime(timestamp)` 헬퍼:
   - < 1분: "방금 전"
   - < 1시간: "N분 전"
   - < 24시간: "N시간 전"
   - < 7일: "N일 전"
   - >= 7일: formatDate(timestamp)

**UI 구조**:

```
┌────────────────────────────────────┐
│ 📊 최근 활동                        │
│                                    │
│ 💬 김태은                     2분 전 │
│    채팅: "내일 회의 시간 변경..."     │
│                                    │
│ 📁 이수진                     5분 전 │
│    자료: "프로젝트 기획서" 업로드     │
│                                    │
│ ☑ 박민수                    10분 전 │
│    할일: "UI 디자인" → 진행중        │
│                                    │
│ ... (최대 10건)                     │
│                                    │
│ (빈 상태: "아직 활동이 없습니다")    │
└────────────────────────────────────┘
```

**각 FeedItem 렌더링**:

```html
<li className="flex items-start gap-3 py-3 border-b last:border-0">
  <span className="text-lg">{item.icon}</span>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium">{item.title}</p>
    <p className="text-xs text-gray-500 truncate">{item.description}</p>
  </div>
  <span className="text-xs text-gray-400 whitespace-nowrap">{relativeTime}</span>
</li>
```

---

### 4.3 UpcomingDeadlines (신규 — DB-03)

**File**: `src/components/features/dashboard/UpcomingDeadlines.tsx`

**Props**:

```typescript
interface UpcomingDeadlinesProps {
  actions: ActionItem[];
}
```

**내부 로직**:

1. 필터: `actions.filter(a => a.dueDate && a.status !== 'done')`
2. `daysUntilDue(dueDate)` 계산:
   - `Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))`
3. 7일 이내만 유지: `daysUntil <= 7`
4. 정렬: dueDate 오름차순 (가장 급한 것 먼저)
5. 최대 5건 표시

**긴급도 색상**:

| 조건 | 색상 | Tailwind |
|------|------|----------|
| 기한 지남 (daysUntil < 0) | 빨강 | `text-red-600 bg-red-50` |
| 오늘/내일 (0-1일) | 빨강 | `text-red-600 bg-red-50` |
| 2-3일 이내 | 주황 | `text-orange-600 bg-orange-50` |
| 4-7일 이내 | 회색 | `text-gray-600 bg-gray-50` |

**urgencyLabel(daysUntil)**:
- < 0: "기한 지남"
- 0: "오늘"
- 1: "내일"
- else: `${daysUntil}일 남음`

**UI 구조**:

```
┌────────────────────────────────────┐
│ ⏰ 다가오는 기한                     │
│                                    │
│ ☑ UI 디자인 완성         🔴 오늘    │
│   담당: 김태은                      │
│                                    │
│ ☑ API 문서 작성         🟠 3일 남음 │
│   담당: 이수진                      │
│                                    │
│ (빈 상태: "7일 이내 기한 없음 👏")   │
│                                    │
│               액션 전체 보기 →       │
└────────────────────────────────────┘
```

"액션 전체 보기 →" → Link to `/actions`

---

### 4.4 TodoList (수정 — DB-04)

**File**: `src/components/features/dashboard/TodoList.tsx`

**Props 변경**:

```typescript
interface TodoListProps {
  todos: ActionItem[];
  members: TeamMember[];                    // 신규: 담당자 이름 조회용
  onToggle: (id: string, status: ActionStatus) => void;
}
```

**변경 사항**:

1. **3단계 상태 지원**: 체크박스 → 3색 상태 아이콘 버튼
   - open: `○` 회색 → 클릭 시 `in_progress`
   - in_progress: `◐` 파랑 → 클릭 시 `done`
   - done: `●` 초록 → 클릭 시 `open`

2. **담당자 표시**: `getMemberName(assigneeId, members)` → 이름 또는 "미배정"

3. **기한 표시 + 경고**: 기한 지남/오늘이면 `text-red-500`, 아니면 `text-gray-400`

4. **최대 5건**: open/in_progress 우선 → 최대 5건 표시

5. **"더보기" 링크**: `todos.length > 5` 시 하단에 `<Link href="/actions">전체 보기 ({total}개) →</Link>`

6. **빈 상태**: "채팅에서 메시지를 할일로 변환해보세요" + Link to `/chat`

**상태 순환 로직**:

```typescript
function nextStatus(current: ActionStatus): ActionStatus {
  const cycle: Record<ActionStatus, ActionStatus> = {
    open: 'in_progress',
    in_progress: 'done',
    done: 'open',
  };
  return cycle[current];
}
```

**상태 아이콘 매핑**:

```typescript
const statusIcon: Record<ActionStatus, { icon: string; color: string }> = {
  open: { icon: '○', color: 'text-gray-400 hover:text-blue-500' },
  in_progress: { icon: '◐', color: 'text-blue-500 hover:text-green-500' },
  done: { icon: '●', color: 'text-green-500 hover:text-gray-400' },
};
```

---

### 4.5 RecentFiles (수정 — DB-05)

**File**: `src/components/features/dashboard/RecentFiles.tsx`

**Props 변경 없음** (동일):

```typescript
interface RecentFilesProps {
  files: SharedFile[];
}
```

**변경 사항**:

1. **파일 항목 클릭**: 각 `<li>`를 `<a href={file.fileUrl} target="_blank">` 래핑 → 파일 열기
2. **hover 효과**: `hover:bg-gray-50 cursor-pointer transition-colors`
3. **"더보기" 링크**: `files.length > 5` 시 하단에 `<Link href="/files">전체 보기 ({total}개) →</Link>`
4. **빈 상태 개선**: "아직 공유된 자료가 없습니다" + Link to `/files`

---

### 4.6 QuickActions (신규 — DB-07)

**File**: `src/components/features/dashboard/QuickActions.tsx`

**Props**: 없음 (정적 컴포넌트)

**UI 구조**:

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  💬 채팅  │  │  📁 자료  │  │  📌 액션  │
│  대화하기  │  │  업로드   │  │  관리하기  │
└──────────┘  └──────────┘  └──────────┘
```

**구현**:

```typescript
const quickActions = [
  { href: '/chat', icon: '💬', label: '채팅', description: '대화하기' },
  { href: '/files', icon: '📁', label: '자료', description: '업로드' },
  { href: '/actions', icon: '📌', label: '액션', description: '관리하기' },
];
```

각 항목: `<Link>` → `flex flex-col items-center gap-1 p-4 bg-white rounded-xl border hover:bg-blue-50 hover:border-blue-200 transition-colors`

레이아웃: `grid grid-cols-3 gap-3`

---

### 4.7 DashboardPage (수정 — DB-06, DB-08)

**File**: `src/app/(main)/dashboard/page.tsx`

**변경 사항**:

1. **useChat 추가**: `const { messages, unreadCount } = useChat(teamId);`
2. **팀 요약 헤더**: 기존 팀명/초대코드 + 멤버 수, 안 읽은 메시지 badge, 전체 액션 진행률
3. **레이아웃 재구성**:

```
┌─────────────────────────────────────────────┐
│ 팀명        초대코드: XXXXX                  │
│ 👥 5명  💬 3 안읽음  📌 진행률 60%           │
├─────────────────────────────────────────────┤
│ [StatCard][StatCard][StatCard]               │
│ [StatCard][StatCard][StatCard]               │
├─────────────────────────────────────────────┤
│ [💬 채팅] [📁 자료] [📌 액션]  ← QuickActions│
├──────────────────────┬──────────────────────┤
│ 📌 진행 중인 할일     │ 📊 최근 활동          │
│ (TodoList, 5건)      │ (ActivityFeed, 10건)  │
│                      │                      │
│ ⏰ 다가오는 기한      │ 📁 최근 공유 자료     │
│ (UpcomingDeadlines)  │ (RecentFiles, 5건)   │
└──────────────────────┴──────────────────────┘
```

**팀 요약 헤더 (inline badges)**:

```typescript
// 헤더 우측 또는 하단에 배지 3개
<div className="flex gap-4 mt-2">
  <span className="text-sm text-gray-500">👥 {members.length}명</span>
  {unreadCount > 0 && (
    <span className="text-sm text-blue-600">💬 {unreadCount} 안읽음</span>
  )}
  <span className="text-sm text-gray-500">📌 진행률 {todoProgress}%</span>
</div>
```

**Grid 레이아웃**:

```html
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  {/* Left column */}
  <div className="space-y-6">
    <section>
      <h2 className="text-lg font-semibold mb-3">📌 진행 중인 할일</h2>
      <TodoList todos={todos} members={members} onToggle={...} />
    </section>
    <section>
      <h2 className="text-lg font-semibold mb-3">⏰ 다가오는 기한</h2>
      <UpcomingDeadlines actions={actions} />
    </section>
  </div>
  {/* Right column */}
  <div className="space-y-6">
    <section>
      <h2 className="text-lg font-semibold mb-3">📊 최근 활동</h2>
      <ActivityFeed messages={messages} files={files} actions={actions} />
    </section>
    <section>
      <h2 className="text-lg font-semibold mb-3">📁 최근 공유 자료</h2>
      <RecentFiles files={files} />
    </section>
  </div>
</div>
```

---

## 5. Section Card Wrapper

각 섹션을 동일한 카드 스타일로 래핑 (page.tsx에서 적용):

```html
<div className="bg-white rounded-xl border p-4">
  <h2 className="text-lg font-semibold mb-3">{sectionTitle}</h2>
  {children}
</div>
```

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| teamLoading | 전체 Spinner |
| !currentTeam | 팀 온보딩 (기존 유지) |
| 개별 hook isError | 각 섹션에서 graceful fallback (빈 상태 표시), 전체 에러 아님 |

---

## 7. Implementation Order

### Step 1: QuickActions (신규)
- `QuickActions.tsx` 생성
- 3개 바로가기 Link
- 난이도: ★☆☆

### Step 2: DashboardStats (수정)
- StatCard에 `href`, `progress`, `color` prop 추가
- Link 래핑
- 프로그레스 바 렌더링
- 6개 카드 배열 (3열×2행)
- props에 `memberCount`, `unreadCount` 추가
- 난이도: ★★☆

### Step 3: ActivityFeed (신규)
- FeedItem 타입 정의
- 3개 소스 → FeedItem 변환
- 병합 + 정렬 + slice(10)
- formatRelativeTime 헬퍼
- 리스트 렌더링 + 빈 상태
- 난이도: ★★★

### Step 4: UpcomingDeadlines (신규)
- daysUntilDue 계산 로직
- 긴급도 색상 매핑
- 필터 + 정렬 + slice(5)
- 리스트 렌더링 + "액션 전체 보기" 링크 + 빈 상태
- 난이도: ★★☆

### Step 5: TodoList (수정)
- props에 `members` 추가
- 3단계 상태 순환 (nextStatus)
- 상태 아이콘 + 색상 매핑
- getMemberName 함수
- 기한 경고 색상
- 5건 제한 + "더보기" 링크
- 난이도: ★★☆

### Step 6: RecentFiles (수정)
- 파일 항목 `<a>` 래핑 (fileUrl, target="_blank")
- hover 효과
- "더보기" 링크
- 빈 상태 개선
- 난이도: ★☆☆

### Step 7: DashboardPage (수정)
- useChat import + 호출
- 팀 요약 헤더 (멤버 수, 안 읽은 메시지, 진행률)
- DashboardStats props 확장
- QuickActions 배치
- 2열 그리드 레이아웃 (좌: TodoList + UpcomingDeadlines, 우: ActivityFeed + RecentFiles)
- 섹션 카드 래핑
- 난이도: ★★☆

### Step 8: Build & Verify
- `npm run build`
- TypeScript 에러 확인

---

## 8. Summary

| Metric | Value |
|--------|-------|
| 수정 파일 | 4개 |
| 신규 파일 | 3개 |
| 신규 hook | 0개 |
| 신규 타입 (글로벌) | 0개 (FeedItem은 컴포넌트 내부) |
| 구현 순서 | 8단계 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Cycle #6 Design 작성 | Claude (AI) |
