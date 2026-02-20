# dashboard Plan Document

> **Project**: team-share
> **Feature**: dashboard (대시보드 — 활동 요약, 진행률, 통계)
> **PDCA Cycle**: #6
> **Date**: 2026-02-20
> **Author**: Claude (AI)

---

## 1. Background

team-share 프로젝트의 5개 핵심 기능(인증, 팀 관리, 자료 공유, 실시간 채팅, 메시지 액션)이 모두 완성되었다. 현재 대시보드는 Cycle #1에서 만든 기본 뼈대로, 4개 StatCard + TodoList + RecentFiles만 제공한다. 5개 기능의 데이터를 종합하여 팀 활동 현황을 한눈에 파악할 수 있는 대시보드로 개선한다.

---

## 2. Current State Analysis

### 2.1 Existing Files (4개)

| File | 현재 기능 | 한계 |
|------|----------|------|
| `src/app/(main)/dashboard/page.tsx` | DashboardStats + TodoList + RecentFiles + 팀 온보딩 | 채팅/액션 활동 없음, 레이아웃 단순 |
| `src/components/features/dashboard/DashboardStats.tsx` | 4개 StatCard (할일/자료/의사결정/아이디어) | 프로그레스 바 없음, 숫자만 표시 |
| `src/components/features/dashboard/TodoList.tsx` | 체크박스 할일 목록 | open/done만 지원, 담당자/기한 미표시, in_progress 미지원 |
| `src/components/features/dashboard/RecentFiles.tsx` | 최근 5개 파일 목록 | 링크 없음, 파일 클릭 불가 |

### 2.2 Available Data (Hooks)

| Hook | 사용 가능 데이터 | 현재 대시보드 활용 |
|------|-----------------|-------------------|
| `useAuth` | user (name, email, role) | ✅ 온보딩 인사말 |
| `useTeam` | currentTeam, members, teamId | ✅ 팀명/초대코드 |
| `useFiles` | files (title, size, type, uploader, date) | ✅ RecentFiles |
| `useActions` | actions, todos, decisions, ideas, todoProgress, openTodos, doneTodos | ✅ StatCard + TodoList |
| `useChat` | messages, unreadCount | ❌ 미사용 |

### 2.3 Gap Summary

- **채팅 데이터 미활용**: unreadCount, 최근 메시지 미표시
- **액션 데이터 부족**: 전체 액션 진행률, 기한 임박 항목, 담당자별 현황 없음
- **멤버 정보 미활용**: 팀원 수, 멤버 목록 미표시
- **시각적 빈약**: 프로그레스 바, 시각적 지표 없음
- **인터랙션 부족**: 빠른 이동 링크, 클릭 가능한 항목 없음

---

## 3. Requirements

| ID | Requirement | Priority | Type |
|----|-------------|:--------:|:----:|
| DB-01 | DashboardStats 시각적 개선 — 프로그레스 바, 색상 아이콘, 클릭 시 해당 페이지 이동 | P0 | 수정 |
| DB-02 | 활동 피드 — 최근 채팅/파일/액션 통합 타임라인 (최근 10건) | P0 | 신규 |
| DB-03 | 다가오는 기한 — 기한 임박 액션 목록 (7일 이내), 긴급도 색상 표시 | P0 | 신규 |
| DB-04 | TodoList 개선 — 3단계 상태 지원, 담당자/기한 표시, 최대 5건 + "더보기" 링크 | P1 | 수정 |
| DB-05 | RecentFiles 개선 — /files 페이지 링크, 파일 클릭 시 상세 | P1 | 수정 |
| DB-06 | 팀 요약 헤더 — 팀원 수, 안 읽은 메시지 수, 전체 액션 진행률 표시 | P0 | 수정 |
| DB-07 | 빠른 액션 바 — 채팅으로/자료 업로드/액션 보기 바로가기 버튼 | P1 | 신규 |
| DB-08 | 페이지 레이아웃 재구성 — 상단 헤더 → Stats → 2열 그리드 (좌: 할일+기한, 우: 활동+파일) | P0 | 수정 |

---

## 4. File Plan

### 4.1 수정 대상 (4개)

| File | Changes |
|------|---------|
| `src/app/(main)/dashboard/page.tsx` | useChat 추가, 레이아웃 재구성 (헤더→Stats→2열 그리드), QuickActions/ActivityFeed/UpcomingDeadlines 배치 |
| `src/components/features/dashboard/DashboardStats.tsx` | 프로그레스 바 추가, 색상 아이콘, Link 래핑 (클릭 시 이동), 멤버 수 StatCard 추가 |
| `src/components/features/dashboard/TodoList.tsx` | 3단계 상태 select, 담당자 이름 표시, 기한 경고 색상, 최대 5건 + "더보기" 링크, 빈 할일 시 /chat 유도 |
| `src/components/features/dashboard/RecentFiles.tsx` | /files 링크 추가, 각 파일 항목 클릭 가능, "더보기" 링크 |

### 4.2 신규 생성 (3개)

| File | Description |
|------|-------------|
| `src/components/features/dashboard/ActivityFeed.tsx` | 최근 활동 통합 타임라인 (채팅 메시지 + 파일 업로드 + 액션 생성, 시간순 정렬, 최근 10건) |
| `src/components/features/dashboard/UpcomingDeadlines.tsx` | 기한 임박 액션 목록 (7일 이내), 긴급도 색상 (빨강: 오늘/내일, 주황: 3일, 회색: 7일), /actions 링크 |
| `src/components/features/dashboard/QuickActions.tsx` | 바로가기 버튼 3개 (💬 채팅 → /chat, 📁 자료 업로드 → /files, 📌 액션 관리 → /actions) |

---

## 5. Implementation Approach

### 5.1 Data Flow

```
DashboardPage
├── useAuth() → user
├── useTeam() → currentTeam, members, teamId
├── useFiles(teamId) → files
├── useActions(teamId) → actions, todos, todoProgress, openTodos, ...
├── useChat(teamId) → messages, unreadCount
│
├── TeamHeader (팀명, 초대코드, 멤버수, 안 읽은 메시지, 전체 진행률)
├── DashboardStats (5개 StatCard: 할일/자료/의사결정/아이디어/멤버)
├── QuickActions (3개 바로가기)
├── Grid (2열)
│   ├── Left: TodoList + UpcomingDeadlines
│   └── Right: ActivityFeed + RecentFiles
```

### 5.2 ActivityFeed Data Merge

```typescript
type FeedItem = {
  id: string;
  type: 'chat' | 'file' | 'action';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
};

// 3개 소스 병합 → createdAt 내림차순 → 최근 10건
const feedItems = [...chatFeed, ...fileFeed, ...actionFeed]
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  .slice(0, 10);
```

### 5.3 UpcomingDeadlines Logic

```typescript
// actions.filter(a => a.dueDate && isWithin7Days(a.dueDate) && a.status !== 'done')
// 정렬: dueDate 오름차순 (가장 급한 것 먼저)
// 색상: 오늘/내일 → red, 3일 이내 → orange, 7일 이내 → gray
```

---

## 6. Constraints & Decisions

| Item | Decision | Reason |
|------|----------|--------|
| 채팅 데이터 활용 | useChat의 messages에서 최근 5건만 피드에 사용 | 전체 메시지 로드는 이미 polling 중이므로 추가 API 불필요 |
| 신규 hook 없음 | 기존 4개 hook만 사용, 대시보드 전용 hook 미생성 | 데이터 가공은 page.tsx에서 충분 |
| StatCard 링크 | Next.js Link 컴포넌트로 래핑 | 클릭 시 해당 기능 페이지로 이동 |
| ActivityFeed 10건 제한 | 슬라이스 후 렌더링 | 성능 + UX (너무 길면 스크롤 과다) |
| TodoList 5건 제한 | 최근 open/in_progress 5건 + "더보기" | 대시보드는 요약, 전체는 /actions에서 |

---

## 7. Out of Scope

| Item | Reason |
|------|--------|
| 실시간 WebSocket 대시보드 | Cycle #6 범위 초과, 현재 polling으로 충분 |
| 차트/그래프 라이브러리 | 외부 의존성 추가 불필요, CSS 프로그레스 바로 충분 |
| 멤버별 통계 | 개별 멤버 성과 분석은 v2 기능 |
| 날짜 범위 필터 | 대시보드는 "현재 상태" 표시, 기간별 분석은 v2 |

---

## 8. Success Criteria

- [ ] DashboardStats에 프로그레스 바 + 클릭 이동 기능
- [ ] ActivityFeed에 최근 10건 통합 타임라인 표시
- [ ] UpcomingDeadlines에 7일 이내 기한 액션 표시
- [ ] TodoList에 3단계 상태 + 담당자 + 기한 표시
- [ ] RecentFiles에 링크 + 클릭 기능
- [ ] 팀 요약 헤더에 멤버 수 + 안 읽은 메시지 + 진행률
- [ ] QuickActions 바로가기 3개
- [ ] 반응형 2열 그리드 레이아웃
- [ ] `npm run build` 성공

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Cycle #6 Plan 작성 | Claude (AI) |
