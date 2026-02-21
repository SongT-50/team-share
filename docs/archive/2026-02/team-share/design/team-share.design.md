# Team Share Design Document

> **Summary**: 팀 생산성 플랫폼 — 자료 공유 + 실시간 채팅 + 메시지 속성 변환(카톡 킬러)
>
> **Project**: team-share
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **Planning Doc**: [team-share.plan.md](../../01-plan/features/team-share.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | ✅ (이 문서에 포함) |
| Phase 2 | Coding Conventions | ✅ (이 문서에 포함) |
| Phase 3 | Mockup | N/A (구현 시 직접 작성) |
| Phase 4 | API Spec | ✅ (이 문서에 포함) |

---

## 1. Overview

### 1.1 Design Goals

- **Chat UI, Database UX**: 카카오톡처럼 편한 입력, 하지만 결과는 구조화된 데이터
- **3초 법칙**: 모든 핵심 액션에 3초 내 도달
- **오프라인 내성**: BaaS 장애 시에도 기본 UI 유지, 에러 안내
- **확장 가능**: v2에서 AI RAG, 모바일 앱 추가 가능한 구조

### 1.2 Design Principles

- **컴포넌트 분리**: UI 컴포넌트(ui/)와 기능 컴포넌트(features/) 명확 분리
- **서버 상태 vs 클라이언트 상태**: TanStack Query(서버) + Zustand(클라이언트) 분리
- **낙관적 업데이트**: 채팅/할일 변환 시 즉시 UI 반영 후 서버 동기화
- **모바일 우선**: 반응형 설계, 터치 친화적 UI

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Auth    │  │  Files   │  │   Chat   │  │Dashboard│  │
│  │  Pages   │  │  Pages   │  │  Pages   │  │ Pages  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │             │             │       │
│  ┌────▼──────────────▼─────────────▼─────────────▼────┐ │
│  │              Hooks + Stores Layer                   │ │
│  │  useAuth / useTeam / useFiles / useChat / useTask   │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                  │
│  ┌─────────────────────▼───────────────────────────────┐ │
│  │           bkend.ts (Infrastructure Client)          │ │
│  └─────────────────────┬───────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────┘
                         │ HTTPS + WebSocket
┌────────────────────────▼─────────────────────────────────┐
│                  bkend.ai (BaaS)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  ┌────────────┐   │
│  │   Auth   │  │Collections│  │Files │  │  WebSocket │   │
│  │  (JWT)   │  │ (MongoDB) │  │Store │  │ (Realtime) │   │
│  └──────────┘  └──────────┘  └──────┘  └────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
[인증 Flow]
회원가입/로그인 → bkend.auth → JWT 발급 → Zustand에 저장 → 인증 헤더 자동 포함

[자료 공유 Flow]
파일 선택 → bkend.upload → fileUrl 반환 → SharedFile 생성 → 목록 갱신

[채팅 Flow]
메시지 입력 → bkend.collection.create → WebSocket broadcast → 실시간 수신

[메시지 속성 변환 Flow]
메시지 롱프레스/클릭 → 속성 선택(할일/의사결정/아이디어) → ActionItem 생성 → 대시보드 반영
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Auth Pages | useAuthStore, bkend.auth | 로그인/회원가입 처리 |
| File Pages | useAuth, bkend.collection, bkend.upload | 파일 업로드/조회 |
| Chat Pages | useAuth, bkend.collection, WebSocket | 실시간 메시지 |
| Dashboard | useAuth, bkend.collection | 통계/할일 조회 |
| ActionItem | ChatMessage 참조 | 메시지에서 변환된 액션 |

---

## 3. Data Model

### 3.1 Entity Definitions

```typescript
// ========== Base ==========
interface BaseDocument {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// ========== User ==========
type UserRole = 'admin' | 'member';

interface User extends BaseDocument {
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string;
  teamId?: string;
}

// ========== Team ==========
interface Team extends BaseDocument {
  name: string;
  description?: string;
  adminId: string;           // User._id (관리자)
  memberIds: string[];       // User._id[] (팀원들)
  inviteCode: string;        // 6자리 초대 코드
}

// ========== SharedFile ==========
type FileType = 'image' | 'document' | 'video' | 'other';

interface SharedFile extends BaseDocument {
  teamId: string;            // Team._id
  uploaderId: string;        // User._id
  uploaderName: string;
  title: string;
  description?: string;
  fileUrl: string;           // bkend.ai 파일 URL
  fileType: FileType;
  fileName: string;
  fileSize: number;          // bytes
  tags: string[];
}

// ========== ChatMessage ==========
type MessageType = 'text' | 'image' | 'file';

interface ChatMessage extends BaseDocument {
  teamId: string;            // Team._id
  senderId: string;          // User._id
  senderName: string;
  content: string;
  type: MessageType;
  fileUrl?: string;
  readBy: string[];          // User._id[]
}

// ========== ActionItem (카톡 킬러 기능) ==========
type ActionType = 'todo' | 'decision' | 'idea';
type ActionStatus = 'open' | 'in_progress' | 'done';

interface ActionItem extends BaseDocument {
  teamId: string;            // Team._id
  sourceMessageId: string;   // ChatMessage._id (원본 메시지)
  creatorId: string;         // User._id (변환한 사람)
  assigneeId?: string;       // User._id (담당자, todo만)
  actionType: ActionType;    // 'todo' | 'decision' | 'idea'
  title: string;             // 요약 제목
  content: string;           // 원본 메시지 내용
  status: ActionStatus;      // 'open' | 'in_progress' | 'done'
  dueDate?: string;          // 기한 (todo만)
  tags: string[];
}

// ========== Auth ==========
interface AuthResponse {
  user: User;
  token: string;
}
```

### 3.2 Entity Relationships

```
[User] 1 ──── 1 [Team] (admin)
  │                │
  └── N ───── 1 ──┘ (member)
                   │
          ┌────────┼────────┐
          │        │        │
   [SharedFile]  [Chat]  [ActionItem]
      N개         N개       N개
                   │
                   └──── 1:N ── [ActionItem]
                        (메시지 → 액션 변환)
```

### 3.3 bkend.ai Collections

| Collection | Description | Index Fields |
|------------|-------------|-------------|
| `users` | 사용자 정보 | email (unique), teamId |
| `teams` | 팀 정보 | inviteCode (unique), adminId |
| `shared-files` | 공유 자료 | teamId, fileType, tags |
| `chat-messages` | 채팅 메시지 | teamId, createdAt |
| `action-items` | 액션 아이템 | teamId, actionType, status, assigneeId |

---

## 4. API Specification

### 4.1 Endpoint List

**인증 (Auth)**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /auth/register | 회원가입 | - |
| POST | /auth/login | 로그인 | - |

**팀 (Teams)**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /collections/teams | 팀 생성 | Required |
| GET | /collections/teams/:id | 팀 상세 조회 | Required |
| PUT | /collections/teams/:id | 팀 정보 수정 | Required (admin) |
| POST | /collections/teams/join | 초대 코드로 합류 | Required |

**자료 (Shared Files)**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /collections/shared-files?teamId= | 자료 목록 | Required |
| GET | /collections/shared-files/:id | 자료 상세 | Required |
| POST | /files/upload | 파일 업로드 | Required |
| POST | /collections/shared-files | 자료 메타데이터 생성 | Required |
| DELETE | /collections/shared-files/:id | 자료 삭제 | Required |

**채팅 (Chat Messages)**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /collections/chat-messages?teamId=&sort=-createdAt | 메시지 목록 | Required |
| POST | /collections/chat-messages | 메시지 전송 | Required |

**액션 아이템 (Action Items)**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /collections/action-items?teamId= | 액션 목록 | Required |
| POST | /collections/action-items | 액션 생성 (메시지에서 변환) | Required |
| PUT | /collections/action-items/:id | 액션 상태 변경 | Required |
| DELETE | /collections/action-items/:id | 액션 삭제 | Required |

### 4.2 Detailed Specification

#### `POST /auth/register`

**Request:**
```json
{
  "email": "admin@team.com",
  "password": "securePassword123",
  "name": "태은"
}
```

**Response (201):**
```json
{
  "user": {
    "_id": "usr_abc123",
    "email": "admin@team.com",
    "name": "태은",
    "role": "admin",
    "createdAt": "2026-02-20T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### `POST /collections/teams`

**Request:**
```json
{
  "name": "우리팀",
  "description": "자료 공유 & 소통 공간",
  "adminId": "usr_abc123"
}
```

**Response (201):**
```json
{
  "_id": "team_xyz789",
  "name": "우리팀",
  "description": "자료 공유 & 소통 공간",
  "adminId": "usr_abc123",
  "memberIds": ["usr_abc123"],
  "inviteCode": "A3F7K2",
  "createdAt": "2026-02-20T10:05:00Z"
}
```

#### `POST /collections/action-items` (카톡 킬러)

**Request:**
```json
{
  "teamId": "team_xyz789",
  "sourceMessageId": "msg_def456",
  "creatorId": "usr_abc123",
  "assigneeId": "usr_member01",
  "actionType": "todo",
  "title": "견적서 전송",
  "content": "내일까지 견적서 보내주세요",
  "status": "open",
  "dueDate": "2026-02-21"
}
```

**Response (201):**
```json
{
  "_id": "act_ghi789",
  "teamId": "team_xyz789",
  "sourceMessageId": "msg_def456",
  "actionType": "todo",
  "title": "견적서 전송",
  "status": "open",
  "dueDate": "2026-02-21",
  "createdAt": "2026-02-20T11:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: 필수 필드 누락
- `401 Unauthorized`: 인증 토큰 없음/만료
- `403 Forbidden`: 팀 권한 없음
- `404 Not Found`: 리소스 없음

---

## 5. UI/UX Design

### 5.1 Screen Layout — Main App Shell

```
┌────────────────────────────────────────────────────┐
│  🏠 Team Share        우리팀 ▾       👤 태은  ⚙️   │  ← Header
├──────────┬─────────────────────────────────────────┤
│          │                                         │
│ 📊 대시보드│         Main Content Area               │
│ 💬 채팅   │                                         │
│ 📁 자료   │     (각 메뉴에 따라 콘텐츠 변경)           │
│ ✅ 할일   │                                         │
│ ⚙️ 설정  │                                         │
│          │                                         │
├──────────┴─────────────────────────────────────────┤
│  (모바일: 하단 탭 바로 전환)                           │
└────────────────────────────────────────────────────┘
```

### 5.2 Screen Layout — Chat + Action 변환

```
┌────────────────────────────────────────────────────┐
│  💬 우리팀 채팅                            👥 5명   │
├────────────────────────────────────────────────────┤
│                                                    │
│  [김팀원] 내일까지 견적서 보내주세요         10:30   │
│                                                    │
│  [박팀원] 네, 알겠습니다!                   10:31   │
│                                                    │
│  ┌──────────────────────────────────────┐          │
│  │ 💡 메시지를 액션으로 변환:             │          │
│  │  ☑ 할일    📋 의사결정    💡 아이디어  │          │
│  └──────────────────────────────────────┘          │
│                                                    │
├────────────────────────────────────────────────────┤
│  [메시지 입력...]               📎  📷  ➤ 전송    │
└────────────────────────────────────────────────────┘
```

### 5.3 Screen Layout — Dashboard

```
┌────────────────────────────────────────────────────┐
│  📊 대시보드                            이번 주 ▾  │
├────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ 할일   │ │ 자료   │ │ 메시지 │ │ 의사결정│     │
│  │  3/7   │ │  12개  │ │  48건  │ │  5건   │     │
│  │  43%   │ │ +3 new │ │ 오늘   │ │ 이번주 │     │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
├────────────────────────────────────────────────────┤
│  📌 진행 중인 할일                                  │
│  ☐ 견적서 전송 (김팀원, 내일까지)                    │
│  ☐ 디자인 시안 검토 (박팀원, 2/22까지)               │
│  ☑ 회의실 예약 완료                                 │
├────────────────────────────────────────────────────┤
│  📁 최근 공유 자료                                  │
│  📄 2월_회의록.pdf (태은, 2시간 전)                  │
│  🖼️ 시안_v2.png (박팀원, 어제)                      │
└────────────────────────────────────────────────────┘
```

### 5.4 User Flow

```
[비인증]
Landing → 로그인 → 팀 선택/생성 → Dashboard
       → 회원가입 → 팀 생성 or 초대코드 입력 → Dashboard

[인증 후]
Dashboard ←→ 채팅 ←→ 자료 ←→ 할일 ←→ 설정
                ↓
        메시지 롱프레스 → 액션 변환 → Dashboard에 반영
```

### 5.5 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `LoginForm` | `src/components/features/auth/LoginForm.tsx` | 로그인 폼 |
| `RegisterForm` | `src/components/features/auth/RegisterForm.tsx` | 회원가입 폼 |
| `TeamCreateForm` | `src/components/features/team/TeamCreateForm.tsx` | 팀 생성 |
| `TeamJoinForm` | `src/components/features/team/TeamJoinForm.tsx` | 초대코드 입력 |
| `Sidebar` | `src/components/features/layout/Sidebar.tsx` | 사이드 네비게이션 |
| `MobileNav` | `src/components/features/layout/MobileNav.tsx` | 모바일 하단 탭 |
| `FileUploader` | `src/components/features/files/FileUploader.tsx` | 파일 업로드 |
| `FileList` | `src/components/features/files/FileList.tsx` | 자료 목록 |
| `FileCard` | `src/components/features/files/FileCard.tsx` | 자료 카드 |
| `FileDetail` | `src/components/features/files/FileDetail.tsx` | 자료 상세 |
| `ChatRoom` | `src/components/features/chat/ChatRoom.tsx` | 채팅방 메인 |
| `MessageBubble` | `src/components/features/chat/MessageBubble.tsx` | 메시지 말풍선 |
| `MessageInput` | `src/components/features/chat/MessageInput.tsx` | 메시지 입력 |
| `ActionConverter` | `src/components/features/chat/ActionConverter.tsx` | 메시지→액션 변환 UI |
| `DashboardStats` | `src/components/features/dashboard/DashboardStats.tsx` | 통계 카드 |
| `TodoList` | `src/components/features/dashboard/TodoList.tsx` | 할일 목록 |
| `RecentFiles` | `src/components/features/dashboard/RecentFiles.tsx` | 최근 자료 |
| `Button` | `src/components/ui/Button.tsx` | 기본 버튼 |
| `Input` | `src/components/ui/Input.tsx` | 기본 입력 |
| `Modal` | `src/components/ui/Modal.tsx` | 모달 |
| `Toast` | `src/components/ui/Toast.tsx` | 토스트 알림 |
| `Avatar` | `src/components/ui/Avatar.tsx` | 프로필 이미지 |
| `Badge` | `src/components/ui/Badge.tsx` | 뱃지 (개수 표시) |
| `Spinner` | `src/components/ui/Spinner.tsx` | 로딩 스피너 |

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | 입력 정보를 확인해주세요 | 필드 누락/형식 오류 | 폼 필드 하이라이트 + 에러 메시지 |
| 401 | 로그인이 필요합니다 | 토큰 만료/없음 | /login으로 리다이렉트 |
| 403 | 권한이 없습니다 | 팀 미소속/관리자 전용 | Toast 알림 |
| 404 | 찾을 수 없습니다 | 삭제된 리소스 | 목록으로 리다이렉트 |
| 413 | 파일이 너무 큽니다 | 10MB 초과 | Toast + 파일 크기 안내 |
| 500 | 서버 오류 | bkend.ai 장애 | Toast + 재시도 버튼 |

### 6.2 Error Response Format

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다",
    "details": {}
  }
}
```

---

## 7. Security Considerations

- [x] Input validation: 이메일 형식, 비밀번호 최소 8자, XSS 필터링
- [x] JWT 인증: bkend.ai 내장 JWT, 헤더에 Bearer 토큰
- [x] 파일 업로드 검증: 허용 확장자 제한, 10MB 용량 제한
- [x] HTTPS: Vercel + bkend.ai 기본 HTTPS
- [x] 팀 접근 제어: teamId 기반 데이터 격리, 소속 팀만 조회 가능

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Zero Script QA | API + UI 통합 | Docker logs + 수동 테스트 |
| 빌드 검증 | 전체 앱 | `npm run build` |
| 수동 테스트 | 유저 플로우 | 브라우저 |

### 8.2 Test Cases (Key)

- [ ] 회원가입 → 로그인 → 팀 생성 → 초대코드 발급
- [ ] 초대코드로 팀원 합류
- [ ] 파일 업로드 → 목록에서 확인 → 상세보기 → 다운로드
- [ ] 채팅 메시지 전송 → 실시간 수신 확인
- [ ] 메시지 → 할일 변환 → 대시보드에 반영
- [ ] 할일 상태 변경 (open → done) → 진행률 업데이트
- [ ] 10MB 초과 파일 업로드 시 에러 처리
- [ ] 미인증 상태로 대시보드 접근 시 로그인 리다이렉트

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | 페이지, UI 컴포넌트, 레이아웃 | `src/app/`, `src/components/` |
| **Application** | Custom Hooks (비즈니스 로직 조합) | `src/hooks/` |
| **Domain** | 타입 정의, 비즈니스 규칙 | `src/types/` |
| **Infrastructure** | bkend.ai 클라이언트, 유틸리티 | `src/lib/`, `src/stores/` |

### 9.2 Dependency Rules

```
Presentation (app/, components/)
      │
      ▼
Application (hooks/)
      │
      ▼
Domain (types/) ◄── Infrastructure (lib/, stores/)
```

### 9.3 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| Pages (login, dashboard, chat, files) | Presentation | `src/app/(auth)/*`, `src/app/(main)/*` |
| Feature Components | Presentation | `src/components/features/*` |
| UI Components | Presentation | `src/components/ui/*` |
| useAuth, useTeam, useFiles, useChat | Application | `src/hooks/` |
| User, Team, SharedFile, ChatMessage, ActionItem | Domain | `src/types/index.ts` |
| bkend client | Infrastructure | `src/lib/bkend.ts` |
| auth-store | Infrastructure | `src/stores/auth-store.ts` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `ChatRoom`, `FileCard` |
| Hooks | camelCase, use 접두사 | `useAuth`, `useFiles` |
| Stores | camelCase, -store 접미사 | `auth-store.ts` |
| Types/Interfaces | PascalCase | `ChatMessage`, `ActionItem` |
| 파일 (컴포넌트) | PascalCase.tsx | `ChatRoom.tsx` |
| 파일 (유틸리티) | kebab-case.ts | `query-provider.tsx` |
| 폴더 | kebab-case | `features/`, `auth/` |
| 상수 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

### 10.2 Import Order

```typescript
// 1. React / Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. 외부 라이브러리
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';

// 3. 내부 절대경로
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { bkend } from '@/lib/bkend';

// 4. 상대경로
import { LocalComponent } from './LocalComponent';

// 5. 타입
import type { User, ChatMessage } from '@/types';
```

### 10.3 Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_BKEND_API_KEY` | bkend.ai API 인증 | Client |
| `NEXT_PUBLIC_BKEND_PROJECT_ID` | bkend.ai 프로젝트 식별 | Client |

### 10.4 Error Handling Pattern

```typescript
// 모든 API 호출에 적용
try {
  const result = await bkend.collection('items').create(data);
  toast.success('저장되었습니다');
} catch (error) {
  const message = error instanceof Error ? error.message : '오류가 발생했습니다';
  toast.error(message);
}
```

---

## 11. Implementation Guide

### 11.1 File Structure (최종)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx          # Sidebar + Auth guard
│   │   ├── dashboard/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── files/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx
│   └── page.tsx                # Landing
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   └── Spinner.tsx
│   └── features/
│       ├── auth/
│       │   ├── LoginForm.tsx
│       │   └── RegisterForm.tsx
│       ├── team/
│       │   ├── TeamCreateForm.tsx
│       │   └── TeamJoinForm.tsx
│       ├── layout/
│       │   ├── Sidebar.tsx
│       │   └── MobileNav.tsx
│       ├── files/
│       │   ├── FileUploader.tsx
│       │   ├── FileList.tsx
│       │   ├── FileCard.tsx
│       │   └── FileDetail.tsx
│       ├── chat/
│       │   ├── ChatRoom.tsx
│       │   ├── MessageBubble.tsx
│       │   ├── MessageInput.tsx
│       │   └── ActionConverter.tsx
│       └── dashboard/
│           ├── DashboardStats.tsx
│           ├── TodoList.tsx
│           └── RecentFiles.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useTeam.ts
│   ├── useFiles.ts
│   ├── useChat.ts
│   └── useActions.ts
│
├── stores/
│   └── auth-store.ts
│
├── lib/
│   ├── bkend.ts
│   ├── query-provider.tsx
│   └── utils.ts
│
└── types/
    └── index.ts
```

### 11.2 Implementation Order

```
Phase 1: Foundation
─────────────────────────────────────────
1. [ ] types/index.ts 업데이트 (ActionItem 추가)
2. [ ] components/ui/* 기본 UI 컴포넌트 생성
3. [ ] auth 기능 (LoginForm, RegisterForm, 페이지)
4. [ ] team 기능 (TeamCreateForm, TeamJoinForm)
5. [ ] (main)/layout.tsx (Sidebar + Auth guard)

Phase 2: Core Features
─────────────────────────────────────────
6. [ ] files 기능 (FileUploader, FileList, FileCard, FileDetail)
7. [ ] chat 기능 (ChatRoom, MessageBubble, MessageInput)
8. [ ] ActionConverter (메시지 → 액션 변환)
9. [ ] hooks (useTeam, useFiles, useChat, useActions)

Phase 3: Dashboard & Polish
─────────────────────────────────────────
10. [ ] dashboard 기능 (DashboardStats, TodoList, RecentFiles)
11. [ ] 반응형 레이아웃 (MobileNav)
12. [ ] 에러 처리 + Toast
13. [ ] 프로필 설정
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial draft — Plan 기반 설계 | 태은 |
