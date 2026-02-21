# Message Actions Planning Document

> **Summary**: 메시지 속성 변환 완성 — 액션 아이템 전용 페이지, 상세 편집, 담당자 배정, 기한 관리, 삭제, 필터/정렬
>
> **Project**: team-share
> **Feature**: message-actions
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **PDCA Cycle**: #5

---

## 1. Overview

### 1.1 Purpose

Cycle #1에서 메시지를 액션(할일/의사결정/아이디어)으로 변환하는 기본 기능(ActionConverter, useActions, TodoList)이 구현되었으나, **액션 아이템 전용 관리 페이지**가 없고, 편집/삭제/담당자 배정/기한 관리 등 실질적 팀 업무 관리에 필수적인 기능이 부재함. 이 기능을 완성하여 "메시지 → 업무 전환"이라는 카카오톡 차별화 핵심 가치를 실현한다.

### 1.2 현재 상태 (Cycle #1 결과물)

| 항목 | 상태 | 파일 |
|------|:----:|------|
| ActionConverter (메시지 → 액션 변환 UI) | ✅ 존재 | `ActionConverter.tsx` |
| useActions hook (조회, updateStatus) | ✅ 존재 | `useActions.ts` |
| TodoList (대시보드용 할일 목록) | ✅ 존재 | `TodoList.tsx` |
| DashboardStats (할일/의사결정/아이디어 수 카드) | ✅ 존재 | `DashboardStats.tsx` |
| ActionItem 타입 (assigneeId, dueDate, tags 포함) | ✅ 존재 | `types/index.ts` |
| ActionType / ActionStatus 타입 | ✅ 존재 | `types/index.ts` |
| /actions 전용 페이지 | ❌ 없음 | - |
| 액션 상세/편집 뷰 | ❌ 없음 | - |
| 액션 삭제 기능 | ❌ 없음 | - |
| 담당자(assignee) 배정 UI | ❌ 없음 | - |
| 기한(dueDate) 설정 UI | ❌ 없음 | - |
| 3단계 상태 관리 (open → in_progress → done) | ❌ 부분적 | useActions는 updateStatus 있으나 UI는 open/done 토글만 |
| 타입별/상태별 필터 | ❌ 없음 | - |
| 정렬 (최신순/기한순/상태순) | ❌ 없음 | - |
| Sidebar/MobileNav 내비게이션 | ❌ 없음 | - |

---

## 2. Scope

### 2.1 In Scope

- [x] /actions 전용 라우트 및 페이지
- [x] 액션 목록 (타입별 탭: 전체/할일/의사결정/아이디어)
- [x] 액션 상세/편집 (제목, 내용, 태그, 기한, 담당자)
- [x] 액션 삭제 (생성자/관리자, 확인 다이얼로그)
- [x] 담당자 배정 (팀 멤버 드롭다운)
- [x] 기한 설정 (날짜 입력)
- [x] 3단계 상태 관리 (open → in_progress → done)
- [x] 필터 (타입별, 상태별)
- [x] useActions hook 확장 (delete, update, create 추가)
- [x] Sidebar/MobileNav에 액션 메뉴 추가

### 2.2 Out of Scope (v2 이후)

- 알림 연동 (담당자 배정 시 알림)
- 캘린더 뷰 (기한별 시각화)
- 반복 할일
- 하위 할일 (체크리스트)
- 드래그 & 드롭 칸반 보드
- 액션 코멘트/토론

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | 의존성 |
|----|-------------|:--------:|--------|
| MA-01 | /actions 전용 페이지 (탭 UI: 전체/할일/의사결정/아이디어) | P0 | useActions |
| MA-02 | 액션 목록 컴포넌트 (상태 badge, 담당자, 기한 표시) | P0 | useActions, useTeam |
| MA-03 | 액션 상세/편집 (제목, 내용, 태그, 기한, 담당자 수정) | P0 | useActions |
| MA-04 | 액션 삭제 (생성자/관리자, 확인 다이얼로그) | P0 | useActions |
| MA-05 | 담당자 배정 (팀 멤버 드롭다운 선택) | P1 | useTeam (members) |
| MA-06 | 기한 설정 (date input) | P1 | - |
| MA-07 | 3단계 상태 전환 (open → in_progress → done) | P0 | useActions |
| MA-08 | useActions hook 확장 (deleteAction, updateAction 추가) | P0 | useActions |
| MA-09 | Sidebar/MobileNav에 액션 메뉴 추가 | P0 | Sidebar, MobileNav |
| MA-10 | 필터/정렬 (상태별 필터, 최신순/기한순 정렬) | P1 | - |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| UX | 상태 변경 즉시 UI 반영 (TanStack Query invalidation) |
| 성능 | 클라이언트 사이드 필터 (100개 이하 가정) |
| 보안 | 삭제/수정 권한 체크 (생성자 또는 관리자) |
| 접근성 | 탭 네비게이션, 키보드 접근 가능 |

---

## 4. Success Criteria

- [ ] /actions 페이지에서 타입별 탭 전환 동작
- [ ] 액션 상세 열기 → 편집 → 저장 동작
- [ ] 액션 삭제 (확인 후) 동작
- [ ] 담당자 배정 UI 동작
- [ ] 기한 설정 UI 동작
- [ ] 3단계 상태 전환 (open ↔ in_progress ↔ done) 동작
- [ ] 필터/정렬 동작
- [ ] Sidebar/MobileNav에 액션 메뉴 표시
- [ ] 빌드 성공 (`npm run build`)
- [ ] Gap Analysis Match Rate >= 90%

---

## 5. Technical Approach

### 5.1 수정/생성할 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/hooks/useActions.ts` | **수정** | deleteAction, updateAction mutations 추가, isError, refetch 노출 |
| `src/components/features/actions/ActionList.tsx` | **생성** | 액션 목록 (상태 badge, 담당자, 기한, 삭제 버튼) |
| `src/components/features/actions/ActionDetail.tsx` | **생성** | 액션 상세/편집 (제목, 내용, 태그, 기한, 담당자) |
| `src/app/(main)/actions/page.tsx` | **생성** | /actions 라우트 (탭, 필터, 정렬) |
| `src/components/features/layout/Sidebar.tsx` | **수정** | 액션 메뉴 추가 |
| `src/components/features/layout/MobileNav.tsx` | **수정** | 액션 메뉴 추가 |

### 5.2 구현 순서

```
Step 1: useActions hook 확장 (deleteAction, updateAction, isError, refetch)
Step 2: ActionList 컴포넌트 생성 (목록, 상태 badge, 담당자, 기한)
Step 3: ActionDetail 컴포넌트 생성 (상세/편집, 삭제 확인)
Step 4: actions/page 생성 (탭, 필터, 정렬, 에러 UI)
Step 5: Sidebar + MobileNav 수정 (액션 메뉴 추가)
Step 6: 빌드 검증
```

---

## 6. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 팀 멤버 목록 로딩 | 담당자 드롭다운이 비어있을 수 있음 | useTeam에서 members 가져오기, 로딩 중 스켈레톤 |
| 대량 액션 아이템 | 클라이언트 필터 성능 | 100개 이하 가정, 페이지네이션은 v2 |
| ActionConverter 호환성 | 기존 변환 기능과 충돌 가능 | ActionConverter는 수정하지 않음 (생성 전용 유지) |
| 네비게이션 항목 증가 | 모바일에서 5→6개로 밀집 | 대시보드를 합치거나 아이콘 크기 조정 검토 |

---

## 7. Next Steps

1. `/pdca design message-actions` — 상세 설계
2. `/pdca do message-actions` — 구현

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial draft - 기존 코드 분석 기반, 10개 요구사항 | 태은 |
