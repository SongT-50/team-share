# team-share

## Project Overview
팀 협업 및 자료 공유 플랫폼. 관리자가 팀원들과 자료를 공유하고, 실시간 채팅으로 소통하며, 파일/사진을 업로드할 수 있는 서비스.

## Level
Dynamic (Fullstack with BaaS)

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **State**: Zustand (client state), TanStack Query (server state)
- **Backend**: bkend.ai (BaaS - Auth, DB, File Storage, WebSocket)
- **Deployment**: Vercel (frontend) + bkend.ai (backend)

## Core Features
- P0: 인증 (관리자/팀원), 팀 관리, 자료 공유 (파일/사진 업로드)
- P1: 실시간 채팅 (팀별 채팅방)
- P2: 알림 시스템

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 (login, register)
│   ├── (main)/            # 메인 기능 (dashboard, chat, files, settings)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                # 기본 UI 컴포넌트
│   └── features/          # 기능별 컴포넌트
├── hooks/                 # Custom hooks
├── lib/                   # 유틸리티 (bkend client 등)
├── stores/                # Zustand stores
└── types/                 # TypeScript 타입 정의
```

## Conventions
- 컴포넌트: PascalCase (e.g., ChatRoom.tsx)
- 훅: camelCase, use 접두사 (e.g., useAuth.ts)
- 스토어: camelCase, -store 접미사 (e.g., auth-store.ts)
- 타입: PascalCase, interface 우선 사용
- 파일명: kebab-case (컴포넌트 제외)

## Commands
- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run lint` - ESLint 실행
