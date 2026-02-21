# Team Share Planning Document

> **Summary**: 팀원들과 자료를 공유하고 실시간 소통하며, 대화를 구조화된 지식 자산으로 축적하는 팀 생산성 플랫폼
>
> **Project**: team-share
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

카카오톡은 팀원들을 '연결'하지만 '성공'시키지는 않는다.
Team Share는 **휘발되는 대화를 구조화된 데이터로 전환**하여, 팀의 소통이 곧 팀의 자산이 되는 생산성 플랫폼이다.

**핵심 차별화 (vs 카카오톡):**

| 관점 | 카카오톡 | Team Share |
|------|---------|------------|
| 데이터 성격 | 비구조화 (휘발성) | 구조화 (자산화) |
| 맥락 | 친구/광고/업무 혼재 | 팀 업무에 집중 |
| 검색 | 수동 스크롤 | AI 기반 즉답 |
| 결과물 | '말'이 남음 | '결과'가 남음 |
| 파일 관리 | 유효기간 제한 | 영구 보관 + 분류 |

### 1.2 Background

- **문제**: 팀 운영 시 카카오톡으로 소통하면 중요한 의사결정, 자료, 정보가 대화 속에 묻혀 사라짐
- **기회**: Pieceful 앱의 "Chat UI, but Database UX" 전략이 증명됨 — 편하게 입력하되 결과는 구조화된 데이터로 남기는 방식
- **비전**: 팀이 6개월간 사용하면, 축적된 데이터가 곧 **팀의 운영 매뉴얼**이 되어 이탈 비용(Switching Cost)이 자연스럽게 발생

### 1.3 Related Documents

- 참고 사례: [Pieceful 앱 - 바이브 코딩 성공 사례](https://yozm.wishket.com/magazine/detail/3613/)
- Gemini CTO 분석: 카카오톡 차별화 전략 3가지 관점 (CTO/기업가/투자자)

---

## 2. Scope

### 2.1 In Scope (MVP)

- [x] 인증 시스템 (관리자/팀원 구분)
- [x] 팀 생성 및 초대 코드 기반 팀원 합류
- [x] 자료 공유 (파일/사진 업로드, 목록, 상세 보기)
- [x] 실시간 채팅 (팀별 채팅방)
- [x] 메시지 속성 부여 (일반 메시지 → 할일/의사결정/아이디어로 변환)
- [x] 대시보드 (팀 활동 요약, 최근 자료, 진행률)

### 2.2 Out of Scope (v2 이후)

- AI RAG 기반 검색 ("저번에 합의한 단가가 얼마였지?")
- 카카오톡 대화 내용 임포트 → 자동 회의록 생성
- 외부 서비스 연동 (Google Drive, Notion 등)
- 모바일 앱 (React Native)
- 화상 회의

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 관리자 회원가입/로그인 (이메일 + 비밀번호) | P0 | Pending |
| FR-02 | 팀 생성 (관리자가 팀 이름/설명 입력) | P0 | Pending |
| FR-03 | 초대 코드 생성 및 팀원 합류 | P0 | Pending |
| FR-04 | 파일 업로드 (이미지, 문서, 동영상) | P0 | Pending |
| FR-05 | 자료 목록 보기 (파일 유형별 필터, 태그 검색) | P0 | Pending |
| FR-06 | 자료 상세 보기 (미리보기, 다운로드) | P0 | Pending |
| FR-07 | 팀별 실시간 채팅 (텍스트/이미지/파일 전송) | P1 | Pending |
| FR-08 | 메시지 속성 변환 (→ 할일, 의사결정, 아이디어) | P1 | Pending |
| FR-09 | 대시보드 (최근 활동, 자료 통계, 할일 현황) | P1 | Pending |
| FR-10 | 프로필 설정 (이름, 프로필 사진 변경) | P2 | Pending |
| FR-11 | 알림 (새 자료, 새 메시지, 멘션) | P2 | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 성능 | 페이지 로딩 < 2초, 채팅 전송 < 500ms | Lighthouse, Network 탭 |
| 보안 | JWT 인증, HTTPS, XSS 방지 | OWASP 체크리스트 |
| UX | 모바일 반응형, 3초 내 핵심 액션 도달 | 사용성 테스트 |
| 안정성 | 99% 가동률 (BaaS 기준) | bkend.ai 모니터링 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 P0 기능 구현 및 동작 확인
- [ ] 모든 P1 기능 구현 및 동작 확인
- [ ] 반응형 레이아웃 (모바일/태블릿/데스크톱)
- [ ] 코드 리뷰 완료
- [ ] 배포 완료 (Vercel)

### 4.2 Quality Criteria

- [ ] Lint 에러 0건
- [ ] 빌드 성공
- [ ] Lighthouse 성능 점수 70+ (모바일 기준)
- [ ] Gap Analysis Match Rate 90% 이상

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 실시간 채팅 WebSocket 안정성 | High | Medium | bkend.ai 내장 WebSocket 활용, 재연결 로직 구현 |
| 파일 업로드 용량 제한 (BaaS) | Medium | High | 이미지 압축 처리, 파일 크기 제한 (10MB) |
| 카카오톡과의 차별화 부족 | High | Medium | 메시지 속성 변환, 대시보드 등 생산성 기능에 집중 |
| bkend.ai 서비스 장애 | High | Low | 에러 핸들링 UI, 오프라인 캐싱 (v2) |
| 초기 사용자 학습 곡선 | Medium | Medium | 온보딩 튜토리얼, 직관적 UI 설계 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based, BaaS backend | Web apps, SaaS MVPs | ☑ |
| **Enterprise** | Microservices, Kubernetes | High-traffic systems | ☐ |

**선택 근거**: BaaS(bkend.ai)로 인증/DB/WebSocket을 처리하므로 별도 서버 인프라 불필요. 빠른 MVP 개발에 최적.

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | **Next.js 15 (App Router)** | SSR/SSG 지원, 파일 기반 라우팅 |
| State Management | Context / Zustand / Redux | **Zustand** | 경량, 보일러플레이트 최소 |
| Server State | fetch / axios / TanStack Query | **TanStack Query** | 캐싱, 자동 갱신, 낙관적 업데이트 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS** | 빠른 프로토타이핑, 일관성 |
| Backend | 자체 서버 / Firebase / bkend.ai | **bkend.ai** | 내장 Auth, DB, WebSocket, 파일 스토리지 |
| 실시간 통신 | Polling / SSE / WebSocket | **WebSocket (bkend.ai)** | 양방향 실시간 통신 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

src/
├── app/                    # Presentation Layer (Pages & Routes)
│   ├── (auth)/            # 인증 그룹
│   └── (main)/            # 메인 기능 그룹
├── components/
│   ├── ui/                # 재사용 UI 컴포넌트
│   └── features/          # 기능별 컴포넌트 (chat, files, team...)
├── hooks/                 # Custom Hooks (비즈니스 로직)
├── stores/                # Zustand Stores (클라이언트 상태)
├── lib/                   # Infrastructure (bkend client, utils)
└── types/                 # Domain Types
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists (Phase 2 output)
- [ ] `CONVENTIONS.md` exists at project root
- [x] ESLint configuration (`.eslintrc.*`)
- [ ] Prettier configuration (`.prettierrc`)
- [x] TypeScript configuration (`tsconfig.json`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | CLAUDE.md에 기본 정의됨 | 컴포넌트: PascalCase, 파일: kebab-case | High |
| **Folder structure** | 초기 구조 생성됨 | features/ 하위 구조 규칙 | High |
| **Import order** | 미정의 | React → Next → 외부 → 내부 → types | Medium |
| **Error handling** | 미정의 | try/catch + toast 알림 패턴 | Medium |
| **환경 변수** | .env.local 생성됨 | bkend.ai 키 설정 필요 | High |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_BKEND_API_KEY` | bkend.ai API 키 | Client | ☑ (placeholder) |
| `NEXT_PUBLIC_BKEND_PROJECT_ID` | bkend.ai 프로젝트 ID | Client | ☑ (placeholder) |

### 7.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 1 (Schema) | ☐ | `docs/01-plan/schema.md` | Design 단계에서 수행 |
| Phase 2 (Convention) | ☐ | `docs/01-plan/conventions.md` | Design 단계에서 수행 |

---

## 8. Feature Roadmap

### Phase 1: Foundation (MVP Core)
```
Week 1-2:
├── 인증 (FR-01): 로그인/회원가입
├── 팀 관리 (FR-02, FR-03): 생성/초대/합류
└── 자료 공유 (FR-04~06): 업로드/목록/상세
```

### Phase 2: Communication
```
Week 3-4:
├── 실시간 채팅 (FR-07): 텍스트/파일 전송
├── 메시지 속성 변환 (FR-08): 할일/의사결정/아이디어
└── 대시보드 (FR-09): 활동 요약/통계
```

### Phase 3: Polish
```
Week 5:
├── 프로필 설정 (FR-10)
├── 알림 시스템 (FR-11)
└── UI/UX 개선, 반응형 최적화
```

---

## 9. 카카오톡 킬러 기능 전략

### 9.1 "Chat UI, but Database UX"
사용자는 카톡처럼 편하게 메시지를 보내지만, 시스템은 메시지를 자동으로 분류하고 관리함.

### 9.2 메시지 속성 변환 (핵심 차별화)
```
[일반 메시지] "내일까지 견적서 보내주세요"
       ↓ (클릭 한 번)
[할일] 견적서 전송 | 담당: 김팀원 | 기한: 내일
       ↓ (대시보드에 자동 반영)
[진행률] 이번 주 할일 3/7 완료 (43%)
```

### 9.3 맥락의 격리 (Context Isolation)
- 팀 업무만을 위한 깨끗한 공간
- 파일은 유효기간 없이 영구 보관
- 태그/카테고리로 체계적 관리

---

## 10. Next Steps

1. [ ] `/pdca design team-share` — 데이터 모델 & API 설계
2. [ ] bkend.ai 프로젝트 생성 및 API 키 발급
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial draft — Gemini CTO 분석 반영 | 태은 |
