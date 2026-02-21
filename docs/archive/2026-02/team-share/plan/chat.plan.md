# Chat Planning Document

> **Summary**: 실시간 채팅 기능 완성 — 메시지 삭제, 읽음 표시, 안 읽은 수, 날짜 구분, 검색, 에러 처리
>
> **Project**: team-share
> **Feature**: chat
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **PDCA Cycle**: #4

---

## 1. Overview

### 1.1 Purpose

Cycle #1에서 채팅의 기본 뼈대(메시지 목록, 입력, 전송, 파일 첨부, 액션 변환)가 구현되었으나, 실제 사용에 필요한 **메시지 삭제, 읽음 표시, 안 읽은 메시지 수, 날짜 구분선, 메시지 검색** 등이 부재함. 이 기능을 완성하여 팀 소통의 핵심 UX를 확보한다.

### 1.2 현재 상태 (Cycle #1 결과물)

| 항목 | 상태 | 파일 |
|------|:----:|------|
| ChatRoom (메시지 목록 + 입력) | ✅ 존재 | `ChatRoom.tsx` |
| MessageInput (텍스트 + 파일 첨부) | ✅ 존재 | `MessageInput.tsx` |
| MessageBubble (아바타, 이름, 내용, 시간) | ✅ 존재 | `MessageBubble.tsx` |
| ActionConverter (할일/의사결정/아이디어 변환) | ✅ 존재 | `ActionConverter.tsx` |
| useChat hook (폴링 5초, sendMessage, sendFile) | ✅ 존재 | `useChat.ts` |
| /chat 페이지 | ✅ 존재 | `chat/page.tsx` |
| ChatMessage 타입 (readBy 포함) | ✅ 존재 | `types/index.ts` |
| 메시지 삭제 | ❌ 없음 | - |
| 읽음 표시 (readBy UI) | ❌ 없음 | - |
| 안 읽은 메시지 수 (badge) | ❌ 없음 | - |
| 날짜 구분선 | ❌ 없음 | - |
| 메시지 검색 | ❌ 없음 | - |
| 에러 핸들링 (조회/전송 실패) | ❌ 없음 | - |
| 스크롤 개선 (새 메시지 인디케이터) | ❌ 없음 | - |

---

## 2. Scope

### 2.1 In Scope

- [x] 메시지 삭제 (본인 메시지, 확인 후 삭제)
- [x] 읽음 표시 (readBy 활용, 읽은 인원 수 표시)
- [x] 안 읽은 메시지 수 (Sidebar/MobileNav badge)
- [x] 날짜 구분선 (메시지 간 날짜 변경 시)
- [x] 메시지 검색 (내용 텍스트 검색)
- [x] useChat hook 확장 (delete, markAsRead, error, unreadCount)
- [x] 에러 핸들링 (조회 실패 재시도, 전송 실패 toast)
- [x] 스크롤 개선 (하단 이동 버튼)

### 2.2 Out of Scope (v2 이후)

- WebSocket 실시간 (현재 폴링 유지, bkend.ai WebSocket은 v2)
- 메시지 편집
- 답장/인용
- 타이핑 인디케이터 ("~님이 입력 중")
- 무한 스크롤/페이지네이션 (메시지 100개 이하 가정)
- 이모지 리액션

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | 의존성 |
|----|-------------|:--------:|--------|
| CH-01 | 메시지 삭제 (본인 메시지, 확인 다이얼로그) | P0 | useChat, MessageBubble |
| CH-02 | 읽음 표시 (읽은 인원 수 UI) | P0 | useChat, MessageBubble |
| CH-03 | 안 읽은 메시지 수 (Sidebar badge) | P0 | useChat, Sidebar, MobileNav |
| CH-04 | 날짜 구분선 (날짜 변경 시 구분) | P0 | ChatRoom |
| CH-05 | 메시지 검색 (내용 텍스트 검색) | P1 | ChatRoom |
| CH-06 | useChat hook 확장 (delete, markAsRead, error, unreadCount) | P0 | useChat |
| CH-07 | 에러 핸들링 (조회 실패 재시도) | P0 | useChat, chat/page |
| CH-08 | 스크롤 개선 (하단 이동 버튼) | P1 | ChatRoom |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| UX | 메시지 전송 즉시 UI 반영 (낙관적 업데이트) |
| 성능 | 폴링 5초 유지, 검색 debounce 300ms |
| 보안 | 삭제 권한 체크 (본인 메시지만) |
| 접근성 | 키보드 Enter 전송 유지, Shift+Enter 줄바꿈 유지 |

---

## 4. Success Criteria

- [ ] 본인 메시지 삭제 동작 (확인 후)
- [ ] 읽음 표시 UI 정상 (메시지 하단 "읽음 N명")
- [ ] Sidebar/MobileNav에 안 읽은 메시지 badge 표시
- [ ] 날짜 구분선 정상 표시
- [ ] 메시지 검색 동작
- [ ] 에러 상태에서 재시도 버튼 동작
- [ ] 빌드 성공 (`npm run build`)
- [ ] Gap Analysis Match Rate >= 90%

---

## 5. Technical Approach

### 5.1 수정/생성할 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/hooks/useChat.ts` | **수정** | deleteMessage, markAsRead, isError, unreadCount 추가 |
| `src/components/features/chat/ChatRoom.tsx` | **수정** | 날짜 구분선, 검색, 스크롤 개선, 에러 UI |
| `src/components/features/chat/MessageBubble.tsx` | **수정** | 삭제 버튼, 읽음 표시 UI |
| `src/app/(main)/chat/page.tsx` | **수정** | 에러 핸들링, 검색 상태 |
| `src/components/features/layout/Sidebar.tsx` | **수정** | 채팅 메뉴에 unread badge |
| `src/components/features/layout/MobileNav.tsx` | **수정** | 채팅 메뉴에 unread badge |

### 5.2 구현 순서

```
Step 1: useChat hook 확장 (deleteMessage, markAsRead, isError, unreadCount)
Step 2: MessageBubble 수정 (삭제 버튼, 읽음 표시)
Step 3: ChatRoom 수정 (날짜 구분선, 검색, 스크롤 개선)
Step 4: chat/page 수정 (에러 핸들링, 검색 상태)
Step 5: Sidebar + MobileNav (unread badge)
Step 6: 빌드 검증
```

---

## 6. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 폴링 기반 읽음 표시 지연 | readBy 업데이트 5초 딜레이 | 페이지 진입 시 즉시 markAsRead, 폴링은 보조 |
| 대량 메시지 성능 | DOM 렌더링 느림 | 클라이언트 사이드 검색 (100개 이하 가정), 페이지네이션은 v2 |
| 삭제 후 폴링 동기화 | 삭제한 메시지 다시 노출 | 삭제 시 로컬 상태 즉시 제거 + 다음 폴링에서 확인 |

---

## 7. Next Steps

1. `/pdca design chat` — 상세 설계
2. `/pdca do chat` — 구현

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial draft - Cycle #1 분석 기반 | 태은 |
