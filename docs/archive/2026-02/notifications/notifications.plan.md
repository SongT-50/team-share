# notifications Plan Document

> **Project**: team-share
> **Feature**: notifications (알림 시스템)
> **PDCA Cycle**: #7
> **Date**: 2026-02-20
> **Author**: Claude (AI)

---

## 1. Background

team-share 프로젝트의 6개 기능(인증, 팀, 파일, 채팅, 액션, 대시보드)이 모두 완성되었다. 마지막 P2 기능인 **알림 시스템**을 구현하여, 팀 내 주요 이벤트를 사용자에게 전달한다. bkend.ai의 `notifications` 컬렉션을 활용한 인앱 알림으로, 알림 목록 페이지 + 알림 벨 아이콘(Badge) + 알림 설정을 제공한다.

---

## 2. Current State Analysis

### 2.1 Existing Files (0개 — 전체 신규)

알림 관련 코드가 없음. 완전한 신규 기능.

### 2.2 Available Infrastructure

| 항목 | 현재 상태 | 활용 계획 |
|------|----------|----------|
| bkend.ai collections | `notifications` 컬렉션 사용 가능 | 알림 CRUD API |
| Toast (UI) | `useToast()` — 성공/에러/정보 토스트 | 알림 수신 시 토스트 표시 |
| Badge (UI) | `<Badge count={N}>` — 빨간 원형 카운트 | Sidebar/MobileNav 알림 벨 |
| Sidebar/MobileNav | 6개 메뉴 (대시보드/채팅/자료/액션/팀/설정) | 설정에 알림 설정 추가 or 별도 알림 메뉴 |
| useChat (polling) | 5초 polling으로 메시지 갱신 | 알림도 polling 패턴 활용 |
| types/index.ts | 6개 타입 정의 | Notification 타입 추가 |

### 2.3 Notification Events (6개 기능에서 발생)

| 이벤트 | 소스 | 수신자 | 중요도 |
|--------|------|--------|:------:|
| 새 채팅 메시지 | useChat | 팀 전체 (발신자 제외) | 높음 |
| 새 파일 업로드 | useFiles | 팀 전체 (업로더 제외) | 중간 |
| 액션 할당 | useActions (assigneeId 변경) | 할당받은 사용자 | 높음 |
| 액션 상태 변경 | useActions (status 변경) | 액션 생성자 | 중간 |
| 기한 임박 (1일 이내) | 클라이언트 계산 | 담당자 | 높음 |
| 팀 멤버 합류 | useTeam | 팀 전체 | 낮음 |

---

## 3. Requirements

| ID | Requirement | Priority | Type |
|----|-------------|:--------:|:----:|
| NF-01 | Notification 타입 정의 (types/index.ts에 추가) | P0 | 수정 |
| NF-02 | useNotifications hook (조회, 읽음 처리, 안 읽은 수) | P0 | 신규 |
| NF-03 | 알림 생성 유틸리티 (createNotification 함수) | P0 | 신규 |
| NF-04 | NotificationList 컴포넌트 (알림 목록, 읽음/안읽음, 시간 표시) | P0 | 신규 |
| NF-05 | /notifications 페이지 (전체/안읽음 필터, 전체 읽음 처리) | P0 | 신규 |
| NF-06 | NotificationBell (Sidebar/MobileNav에 벨 아이콘 + Badge) | P0 | 수정 |
| NF-07 | 알림 설정 (설정 페이지에 알림 ON/OFF 토글 — 채팅/파일/액션) | P1 | 수정 |
| NF-08 | 알림 자동 생성 — 채팅 메시지 수신 시 알림 생성 (발신자 제외) | P1 | 수정 |
| NF-09 | 알림 자동 생성 — 파일 업로드 시 알림 생성 (업로더 제외) | P1 | 수정 |
| NF-10 | 알림 자동 생성 — 액션 할당/상태 변경 시 알림 생성 | P1 | 수정 |

---

## 4. File Plan

### 4.1 수정 대상 (4개)

| File | Changes |
|------|---------|
| `src/types/index.ts` | Notification, NotificationType 타입 추가 |
| `src/components/features/layout/Sidebar.tsx` | 알림 벨 아이콘 + Badge 추가 (navItems에 /notifications 추가) |
| `src/components/features/layout/MobileNav.tsx` | 알림 벨 아이콘 + Badge 추가 (navItems에 /notifications 추가) |
| `src/app/(main)/settings/page.tsx` | 알림 설정 섹션 추가 (채팅/파일/액션 ON/OFF 토글) |

### 4.2 신규 생성 (4개)

| File | Description |
|------|-------------|
| `src/hooks/useNotifications.ts` | 알림 조회 (polling), 읽음 처리, 전체 읽음, 안 읽은 수, 알림 생성 |
| `src/components/features/notifications/NotificationList.tsx` | 알림 카드 목록 (아이콘, 제목, 시간, 읽음 상태) |
| `src/app/(main)/notifications/page.tsx` | 알림 페이지 (전체/안읽음 탭, 전체 읽음 버튼, NotificationList) |
| `src/stores/notification-store.ts` | Zustand 스토어 — 알림 설정 (로컬 저장, 카테고리별 ON/OFF) |

---

## 5. Implementation Approach

### 5.1 Notification Data Model

```typescript
type NotificationType = 'chat' | 'file' | 'action' | 'team' | 'deadline';

interface Notification extends BaseDocument {
  teamId: string;
  recipientId: string;     // 수신자
  type: NotificationType;
  title: string;           // "김태은님이 메시지를 보냈습니다"
  body: string;            // 메시지 미리보기 또는 상세
  link?: string;           // 클릭 시 이동 경로 (/chat, /files, /actions)
  isRead: boolean;
  sourceId?: string;       // 원본 ID (messageId, fileId, actionId)
}
```

### 5.2 useNotifications Hook

- **polling**: 10초 간격 (useChat의 5초보다 여유롭게)
- **조회**: `bkend.collection('notifications').find({ recipientId: user._id, teamId })`
- **읽음**: `bkend.collection('notifications').update(id, { isRead: true })`
- **전체 읽음**: 안 읽은 알림 전부 update (Promise.allSettled)
- **생성**: `bkend.collection('notifications').create({ ... })` — 다른 hook에서 호출

### 5.3 알림 설정 (Zustand + localStorage)

```typescript
interface NotificationSettings {
  chat: boolean;    // 채팅 알림 (기본: true)
  file: boolean;    // 파일 알림 (기본: true)
  action: boolean;  // 액션 알림 (기본: true)
}
```

로컬 저장소 기반 — 서버에 설정 저장하지 않음 (Dynamic 레벨에서 적절).

### 5.4 알림 자동 생성 위치

| 이벤트 | Hook | 삽입 지점 |
|--------|------|----------|
| 새 메시지 | useChat `sendMessage` | 메시지 생성 성공 후, 팀원 전체에 알림 생성 |
| 파일 업로드 | useFiles (page.tsx에서 업로드 성공 후) | 업로드 성공 콜백에서 알림 생성 |
| 액션 할당 | useActions `updateAction` (assigneeId 변경 시) | update 성공 후 담당자에 알림 |
| 액션 상태 변경 | useActions `updateStatus` | 상태 변경 성공 후 생성자에 알림 |

**대안**: hook 내부 수정 대신, 알림 생성은 `createNotification` 유틸리티로 분리하고, 기존 컴포넌트(ChatRoom, FileUploader, ActionDetail)에서 호출. hook 의존성 최소화.

---

## 6. Constraints & Decisions

| Item | Decision | Reason |
|------|----------|--------|
| 알림 전달 방식 | 인앱 알림 (polling) | 브라우저 Push API/WebSocket 없이 구현 가능 |
| polling 주기 | 10초 | 채팅 5초보다 느리지만 충분, API 부하 최소화 |
| 알림 설정 저장 | localStorage (Zustand persist) | 서버 설정 불필요, 간단한 기기별 설정 |
| 알림 자동 생성 | 컴포넌트 레벨에서 createNotification 호출 | hook 수정 최소화, 명시적 호출 |
| 기한 임박 알림 | 클라이언트에서 대시보드/알림 페이지 로드 시 체크 | 서버 cron 불필요 |
| 알림 삭제 | 미구현 (v2) | 읽음 처리만으로 충분 |

---

## 7. Out of Scope

| Item | Reason |
|------|--------|
| 브라우저 Push Notification | Dynamic 레벨에서 과도, 인앱으로 충분 |
| 이메일 알림 | 서버 사이드 기능 필요, v2 |
| 실시간 WebSocket 알림 | polling으로 충분 |
| 알림 삭제 기능 | 읽음 처리만으로 v1 충분 |
| 알림 그룹핑 (같은 채팅방 메시지 묶기) | 복잡도 높음, v2 |

---

## 8. Success Criteria

- [ ] Notification 타입이 types/index.ts에 추가됨
- [ ] useNotifications hook이 polling으로 알림 조회/읽음/생성 제공
- [ ] NotificationList가 알림 카드를 읽음/안읽음 구분하여 표시
- [ ] /notifications 페이지에 전체/안읽음 필터 + 전체 읽음 기능
- [ ] Sidebar/MobileNav에 알림 벨 + 안 읽은 수 Badge
- [ ] 설정 페이지에 알림 카테고리별 ON/OFF 토글
- [ ] 채팅/파일/액션 이벤트 시 알림 자동 생성
- [ ] `npm run build` 성공

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Cycle #7 Plan 작성 | Claude (AI) |
