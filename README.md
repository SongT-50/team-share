# Team Share

팀 협업 및 자료 공유 플랫폼. 팀원들과 실시간 채팅, 파일 공유, 할일 관리를 할 수 있는 웹 서비스.

**배포 URL**: https://team-share-three.vercel.app
**GitHub**: https://github.com/SongT-50/team-share

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| State | Zustand (클라이언트) + TanStack Query (서버) |
| Backend | bkend.ai (BaaS - 인증, DB) |
| File Storage | Cloudinary (파일/이미지 업로드) |
| Deployment | Vercel (프론트엔드) + bkend.ai (백엔드) |

---

## 주요 기능

### 1. 인증 (P0)
- 이메일 + 비밀번호 회원가입/로그인
- Zustand persist로 로그인 상태 유지
- 비밀번호 입력 시 Caps Lock 감지 표시

### 2. 팀 관리 (P0)
- 팀 생성 (초대 코드 자동 생성)
- 초대 코드로 팀 합류
- 팀 전환 (여러 팀 소속 가능)
- 팀 설정 (이름 변경, 멤버 추방, 초대 코드 재생성)
- 팀 나가기 (남은 팀이 있으면 자동 전환, 없으면 로그아웃)

### 3. 자료 공유 (P0)
- 파일/이미지 업로드 (Cloudinary, 최대 10MB)
- 드래그 & 드롭 업로드
- 태그 입력, 검색, 정렬
- 파일 상세 보기, 편집, 삭제

### 4. 실시간 채팅 (P1)
- 팀별 채팅방
- 텍스트/이미지/파일 메시지
- 메시지 삭제, 읽음 표시
- 날짜 구분선, 메시지 검색
- 최신 메시지가 항상 하단에 표시
- 5초 간격 자동 새로고침 (폴링)

### 5. 메시지 액션 (P1)
- 채팅 메시지를 할일/의사결정/아이디어로 변환
- 탭별 분류, 필터, 정렬
- 담당자 지정, 기한 설정, 상태 변경

### 6. 대시보드 (P1)
- 활동 요약 (통계 카드 6종)
- 통합 타임라인 (최근 활동)
- 다가오는 기한 (긴급도 색상 표시)
- 할일 진행률, 최근 파일, 빠른 액션

### 7. 알림 (P2)
- 자동 생성: 채팅 전송 / 파일 업로드 / 액션 수정 시 팀원에게 알림
- 읽음/안읽음 관리, 전체 읽음 처리
- 알림 유형별 on/off 설정
- 10초 간격 자동 새로고침

---

## 화면 구성

```
[모바일]
┌──────────────────────────┐
│ Team Share    [팀 선택 ▼] │  ← 모바일 헤더 (팀 전환)
├──────────────────────────┤
│                          │
│      페이지 콘텐츠         │
│                          │
├──────────────────────────┤
│ 📊  💬  📁  📌  🔔  👥  ⚙️ │  ← 하단 네비게이션
└──────────────────────────┘

[데스크톱]
┌────────┬─────────────────┐
│        │                 │
│ 사이드바 │   페이지 콘텐츠   │
│ (팀전환) │                 │
│ (메뉴)  │                 │
│ (프로필) │                 │
│        │                 │
└────────┴─────────────────┘
```

### 라우트

| 경로 | 기능 |
|------|------|
| `/login` | 로그인 |
| `/register` | 회원가입 |
| `/dashboard` | 대시보드 |
| `/chat` | 채팅 |
| `/files` | 자료 공유 |
| `/actions` | 액션 (할일/의사결정/아이디어) |
| `/notifications` | 알림 |
| `/team` | 팀 관리 |
| `/settings` | 설정 |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/                # 인증 페이지
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                # 메인 기능 (인증 필요)
│   │   ├── layout.tsx         # 인증 가드 + Sidebar + MobileNav
│   │   ├── dashboard/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── files/page.tsx
│   │   ├── actions/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── team/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx
│   └── page.tsx               # → /dashboard 리다이렉트
├── components/
│   ├── ui/                    # 공통 UI (Avatar, Badge, Button, Input, Modal, Spinner, Toast)
│   └── features/
│       ├── layout/            # Sidebar, MobileNav, MobileHeader
│       ├── chat/              # ChatRoom, MessageBubble, MessageInput
│       ├── files/             # FileUploader, FileList, FileDetail
│       ├── actions/           # ActionList, ActionDetail
│       ├── dashboard/         # DashboardStats, ActivityFeed, UpcomingDeadlines, TodoList, RecentFiles, QuickActions
│       └── notifications/     # NotificationList
├── hooks/                     # useAuth, useTeam, useChat, useFiles, useActions, useNotifications
├── stores/                    # auth-store, team-store, notification-store (Zustand)
├── lib/
│   ├── bkend.ts              # bkend.ai + Cloudinary API 클라이언트
│   └── utils.ts              # cn() 유틸
└── types/                     # TypeScript 타입 정의
```

**파일 수**: 61개 (컴포넌트 35, 훅 6, 스토어 3)

---

## 설치 및 실행

### 방법 1: 배포된 서비스 사용 (가장 간단)

> https://team-share-three.vercel.app 접속 → 회원가입 → 팀 생성 → 사용

### 방법 2: 로컬 개발 환경

**사전 요구사항**: Node.js 18+, Git

```bash
# 1. 클론
git clone https://github.com/SongT-50/team-share.git
cd team-share

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local

# 4. 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 접속.

`.env.example`에 API 키가 이미 포함되어 있어서 별도 설정 없이 바로 실행 가능.

### 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint 검사 |

---

## 사용 가이드

### 시작하기
1. 회원가입 (이메일 + 비밀번호)
2. 팀 생성 (팀 이름 입력 → 초대 코드 자동 생성)
3. 동료에게 초대 코드 공유 → 동료가 "합류" 버튼으로 팀 참여

### 채팅
- 채팅 탭에서 메시지 입력 후 Enter 또는 전송 버튼
- 이미지/파일도 첨부 가능
- 메시지 길게 누르면 → 할일/의사결정/아이디어로 변환

### 파일 공유
- 자료 탭에서 파일 업로드 (드래그 & 드롭 가능)
- 태그 추가하여 분류, 검색으로 빠른 검색

### 알림
- 별도 작성 없음 — 채팅/파일 업로드/액션 수정 시 팀원에게 자동 알림
- 설정에서 알림 유형별 on/off 가능

### 팀 전환
- 모바일: 상단 헤더의 드롭다운
- 데스크톱: 사이드바의 드롭다운

---

## 개발 이력

### PDCA 사이클 (2026-02-20)

7개 기능을 PDCA(Plan→Design→Do→Check→Act) 방법론으로 개발.

| Cycle | 기능 | 우선순위 | Match Rate |
|:-----:|------|:--------:|:----------:|
| #1 | auth (인증) | P0 | 91% → 95% |
| #2 | team-management (팀 관리) | P0 | 90.8% → 95% |
| #3 | file-sharing (자료 공유) | P0 | 98.6% |
| #4 | chat (채팅) | P1 | 99.6% |
| #5 | message-actions (메시지 액션) | P1 | 99.4% |
| #6 | dashboard (대시보드) | P1 | 95% → 99% |
| #7 | notifications (알림) | P2 | 98.5% |

**평균 Match Rate: 96.7%**

### 배포 후 버그 수정 (2026-02-20 ~ 02-21)

| # | 문제 | 원인 | 해결 |
|:-:|------|------|------|
| 1 | 팀 생성 후 로그인으로 리다이렉트 | Zustand persist hydration 타이밍 | MainLayout에 hydrated 상태 추가 |
| 2 | 팀이 표시되지 않음 | bkend.ai가 paginated 응답 반환 | find()에서 items 추출 |
| 3 | 파일 업로드 실패 | bkend.ai에 파일 업로드 API 없음 | Cloudinary 연동 |
| 4 | upload preset not found | 환경변수 문제 | Cloudinary 값 하드코딩 |
| 5 | 두 번째 파일 업로드 실패 | files 테이블 unique 제약 | s3Key 등 필드 추가 |
| 6 | 데이터 필터링 안됨 | bkend.ai 서버 필터링 미지원 | 클라이언트 사이드 필터링 |
| 7 | 팀 전환 시 기존 팀 사라짐 | 항상 teams[0] 선택 | team-store + selectedTeamId |
| 8 | 내 메시지에 이름 미표시 | isMine일 때 이름 숨김 | 모든 메시지에 이름 표시 |
| 9 | 팀 추가 버튼 없음 | 팀 존재 시 생성 UI 숨김 | 팀 추가/합류 버튼 추가 |
| 10 | Caps Lock 감지 없음 | 기능 미구현 | Input에 CapsLock 감지 추가 |
| 11 | 중복 테스트 팀 | 테스트 중 생성 | API로 8개 삭제 |

### 추가 수정 (2026-02-21)

| # | 문제 | 해결 |
|:-:|------|------|
| 12 | 채팅 메시지 순서 뒤바뀜 | createdAt 오름차순 정렬 추가 |
| 13 | 팀 나가기 시 로그아웃 | 남은 팀이 있으면 팀 전환으로 변경 |
| 14 | 모바일에서 채팅 입력창 가려짐 | 하단 네비 높이 반영하여 레이아웃 조정 |
| 15 | 모바일에서 팀 전환 불가 | MobileHeader 컴포넌트 추가 |

---

## 외부 서비스 정보

| 서비스 | 용도 | 비고 |
|--------|------|------|
| [bkend.ai](https://bkend.ai) | 인증 + 데이터베이스 | API Key는 .env.example에 포함 |
| [Cloudinary](https://cloudinary.com) | 파일/이미지 저장 | cloud: dsohxszgq, preset: my_default |
| [Vercel](https://vercel.com) | 프론트엔드 배포 | GitHub main 브랜치 자동 배포 |

### bkend.ai 컬렉션 (테이블)

| 컬렉션 | 용도 |
|--------|------|
| `users` | 사용자 정보 |
| `teams` | 팀 정보 (memberIds, inviteCode, adminId) |
| `chat_messages` | 채팅 메시지 |
| `files` | 공유 파일 메타데이터 |
| `action_items` | 할일/의사결정/아이디어 |
| `notifications` | 알림 |

### bkend.ai 주의사항
- 서버 사이드 필터링 미지원 → 클라이언트에서 필터링
- 응답 형식: `{ data: { items: [...], pagination: {...} } }`
- 파일 업로드 API 없음 → Cloudinary 사용
