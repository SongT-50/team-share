# Team Management Planning Document

> **Summary**: 팀 생성, 초대, 멤버 관리, 팀 설정 등 팀 운영에 필요한 전체 관리 기능
>
> **Project**: team-share
> **Feature**: team-management
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **PDCA Cycle**: #2

---

## 1. Overview

### 1.1 Purpose

Cycle #1에서 팀 생성/합류의 기본 뼈대가 구현되었으나, 실제 팀 운영에 필요한 **멤버 관리, 팀 설정, 팀 전환** 등의 핵심 기능이 부재함. 이 기능을 완성하여 다른 P0 기능(file-sharing)과 P1 기능(chat, dashboard)의 기반을 마련한다.

### 1.2 현재 상태 (Cycle #1 결과물)

| 항목 | 상태 | 파일 |
|------|:----:|------|
| 팀 생성 폼 | ✅ 존재 | `TeamCreateForm.tsx` |
| 초대코드 합류 폼 | ✅ 존재 | `TeamJoinForm.tsx` |
| useTeam hook | ✅ 존재 | `useTeam.ts` (기본 조회만) |
| Team 타입 | ✅ 존재 | `types/index.ts` |
| 대시보드 온보딩 | ✅ 존재 | 팀 없을 때 생성/합류 모달 |
| 팀 멤버 목록 | ❌ 없음 | - |
| 멤버 관리 (삭제/역할) | ❌ 없음 | - |
| 팀 설정 페이지 | ❌ 없음 | - |
| 팀 전환 (다중 팀) | ❌ 없음 | - |
| 초대코드 복사/공유 | ❌ 없음 | - |
| 팀 나가기/삭제 | ❌ 없음 | - |

---

## 2. Scope

### 2.1 In Scope

- [x] 팀 멤버 목록 조회 (이름, 역할, 프로필)
- [x] 멤버 관리 (관리자: 멤버 추방)
- [x] 팀 정보 수정 (이름, 설명)
- [x] 초대 코드 복사 기능
- [x] 초대 코드 재생성 (관리자 전용)
- [x] 팀 나가기 (일반 멤버)
- [x] 팀 삭제 (관리자, 확인 절차 포함)
- [x] Sidebar에 팀 이름 + 멤버 수 표시
- [x] 팀 관리 전용 페이지 (`/team`)

### 2.2 Out of Scope (v2 이후)

- 다중 팀 전환 (현재는 1인 1팀)
- 멤버 역할 세분화 (admin/moderator/member)
- 팀 아바타/로고 업로드
- 팀 활동 로그

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | 의존성 |
|----|-------------|:--------:|--------|
| TM-01 | 팀 멤버 목록 페이지 (`/team`) | P0 | useTeam hook |
| TM-02 | 멤버 카드 (Avatar + 이름 + 역할 뱃지) | P0 | Avatar, Badge UI |
| TM-03 | 초대 코드 복사 버튼 (클립보드) | P0 | - |
| TM-04 | 팀 정보 수정 (이름, 설명) - 관리자 전용 | P0 | useAuth.isAdmin |
| TM-05 | 멤버 추방 - 관리자 전용, 확인 다이얼로그 | P1 | Modal UI |
| TM-06 | 초대 코드 재생성 - 관리자 전용 | P1 | - |
| TM-07 | 팀 나가기 (일반 멤버) | P1 | - |
| TM-08 | 팀 삭제 (관리자, 이중 확인) | P1 | - |
| TM-09 | Sidebar에 팀 정보 표시 (이름, 멤버 수) | P0 | Sidebar 수정 |
| TM-10 | useTeam hook 확장 (멤버 조회, CRUD 메서드) | P0 | bkend.ts |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| UX | 관리자/멤버별 UI 차이 명확히 구분 |
| 보안 | 관리자 전용 API 호출 시 권한 체크 |
| 성능 | 멤버 목록 로딩 < 1초 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `/team` 페이지에서 팀 멤버 목록 확인 가능
- [ ] 관리자가 팀 정보(이름/설명) 수정 가능
- [ ] 초대 코드 복사 기능 동작
- [ ] 관리자가 멤버 추방 가능
- [ ] 일반 멤버가 팀 나가기 가능
- [ ] Sidebar에 팀 이름 + 멤버 수 표시
- [ ] 빌드 성공 (`npm run build`)
- [ ] Gap Analysis Match Rate >= 90%

---

## 5. Technical Approach

### 5.1 수정/생성할 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/app/(main)/team/page.tsx` | **신규** | 팀 관리 페이지 |
| `src/components/features/team/MemberCard.tsx` | **신규** | 멤버 카드 컴포넌트 |
| `src/components/features/team/MemberList.tsx` | **신규** | 멤버 목록 컴포넌트 |
| `src/components/features/team/TeamSettings.tsx` | **신규** | 팀 설정 (수정/삭제) |
| `src/components/features/team/InviteCodeCard.tsx` | **신규** | 초대코드 표시+복사 |
| `src/hooks/useTeam.ts` | **수정** | 멤버 조회, 추방, 탈퇴, 삭제 메서드 추가 |
| `src/components/features/layout/Sidebar.tsx` | **수정** | 팀 메뉴 추가, 팀 정보 표시 |
| `src/components/features/layout/MobileNav.tsx` | **수정** | 팀 메뉴 추가 |

### 5.2 API 사용

| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/collections/users?_id=in:{memberIds}` | 팀 멤버 상세 조회 |
| PUT | `/collections/teams/:id` | 팀 정보 수정, 멤버 추방 |
| DELETE | `/collections/teams/:id` | 팀 삭제 |

### 5.3 구현 순서

```
Step 1: useTeam hook 확장 (멤버 조회 + CRUD)
Step 2: MemberCard, MemberList 컴포넌트
Step 3: InviteCodeCard 컴포넌트
Step 4: TeamSettings 컴포넌트
Step 5: /team 페이지 조립
Step 6: Sidebar/MobileNav 수정
Step 7: 빌드 검증
```

---

## 6. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 멤버 조회 시 N+1 쿼리 | 느린 로딩 | memberIds로 batch 조회 |
| 관리자가 자신을 추방 | 팀 고아 상태 | UI에서 자기 자신 추방 차단 |
| 팀 삭제 시 연관 데이터 | 데이터 고아 | 확인 다이얼로그 + cascade 안내 |

---

## 7. Next Steps

1. `/pdca design team-management` - 상세 설계 (컴포넌트 UI, 상태 관리)
2. `/pdca do team-management` - 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial draft - Cycle #1 분석 기반 | 태은 |
