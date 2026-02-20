# Team Management Design Document

> **Summary**: 팀 멤버 관리, 팀 설정, 초대코드 관리 등 팀 운영 기능 상세 설계
>
> **Project**: team-share
> **Feature**: team-management
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **Planning Doc**: [team-management.plan.md](../../01-plan/features/team-management.plan.md)
> **PDCA Cycle**: #2

---

## 1. Overview

### 1.1 Design Goals

- **관리자 권한 분리**: admin/member 역할에 따른 UI/기능 차별화
- **직관적 멤버 관리**: 멤버 목록, 추방, 초대를 한 페이지에서 처리
- **안전한 위험 작업**: 추방/삭제에 확인 다이얼로그 적용
- **기존 코드 활용**: Cycle #1 컴포넌트(TeamCreateForm, TeamJoinForm, useTeam) 확장

### 1.2 Design Principles

- **최소 변경**: 기존 코드는 수정 최소화, 새 컴포넌트로 기능 추가
- **역할 기반 렌더링**: `useAuth().isAdmin`으로 관리자 전용 UI 조건부 표시
- **낙관적 업데이트**: 멤버 추방/탈퇴 시 즉시 UI 반영 후 서버 동기화
- **재사용**: 기존 UI 컴포넌트(Avatar, Badge, Button, Modal, Input) 활용

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────┐
│  /team (TeamPage)                                    │
│  ┌───────────────────────┬─────────────────────────┐ │
│  │  InviteCodeCard       │  TeamSettings            │ │
│  │  - 초대코드 표시       │  - 팀 이름/설명 수정     │ │
│  │  - 복사 버튼           │  - 초대코드 재생성       │ │
│  │  - 재생성 (admin)      │  - 팀 삭제 (admin)      │ │
│  │                        │  - 팀 나가기 (member)    │ │
│  ├────────────────────────┴─────────────────────────┤ │
│  │  MemberList                                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │ │
│  │  │ MemberCard  │ │ MemberCard  │ │ MemberCard │  │ │
│  │  │ Avatar+Name │ │ Avatar+Name │ │ Avatar+Name│  │ │
│  │  │ Role Badge  │ │ Role Badge  │ │ 추방 버튼  │  │ │
│  │  └─────────────┘ └─────────────┘ └────────────┘  │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
[멤버 조회]
useTeam() → currentTeam.memberIds → bkend.collection('users').find({memberIds})
→ MemberList에 표시

[멤버 추방 (admin)]
추방 버튼 → Modal 확인 → useTeam().removeMember(userId)
→ bkend teams.update(memberIds 제거) → 낙관적 UI 업데이트

[팀 나가기 (member)]
나가기 버튼 → Modal 확인 → useTeam().leaveTeam()
→ bkend teams.update(memberIds에서 자신 제거) → /login 리다이렉트

[팀 정보 수정 (admin)]
폼 입력 → useTeam().updateTeam({name, description})
→ bkend teams.update → Toast 성공

[초대코드 재생성 (admin)]
재생성 버튼 → useTeam().regenerateInviteCode()
→ bkend teams.update({inviteCode: new}) → 새 코드 표시

[팀 삭제 (admin)]
삭제 버튼 → 이중 확인 Modal → useTeam().deleteTeam()
→ bkend teams.delete → /login 리다이렉트
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| TeamPage | useTeam, useAuth | 팀 관리 페이지 |
| MemberList | useTeam (members) | 멤버 목록 표시 |
| MemberCard | Avatar, Badge | 개별 멤버 카드 |
| InviteCodeCard | useTeam (currentTeam) | 초대코드 표시/복사 |
| TeamSettings | useTeam, useAuth, Modal | 팀 설정/삭제 |

---

## 3. Data Model

### 3.1 기존 타입 (변경 없음)

```typescript
// types/index.ts - 이미 존재
interface Team extends BaseDocument {
  name: string;
  description?: string;
  adminId: string;
  memberIds: string[];
  inviteCode: string;
}

interface User extends BaseDocument {
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string;
  teamId?: string;
}
```

### 3.2 신규 타입 (types/index.ts에 추가)

```typescript
// 팀 멤버 상세 정보 (User + 팀 내 역할)
interface TeamMember {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  isAdmin: boolean;
  joinedAt: string; // createdAt 활용
}
```

---

## 4. API Specification

### 4.1 사용할 API

| Method | Endpoint | 용도 | Auth |
|--------|----------|------|:----:|
| GET | `/collections/teams/:id` | 팀 상세 조회 | Required |
| PUT | `/collections/teams/:id` | 팀 정보 수정 (이름/설명/초대코드/멤버) | Required (admin) |
| DELETE | `/collections/teams/:id` | 팀 삭제 | Required (admin) |
| GET | `/collections/users?_id={memberIds}` | 팀 멤버 상세 조회 | Required |

### 4.2 Detailed Specification

#### 팀 정보 수정 `PUT /collections/teams/:id`

**Request (이름/설명 수정):**
```json
{
  "name": "새 팀이름",
  "description": "새 설명"
}
```

**Request (멤버 추방):**
```json
{
  "memberIds": ["usr_1", "usr_3"]  // usr_2 제거됨
}
```

**Request (초대코드 재생성):**
```json
{
  "inviteCode": "X7K2M9"
}
```

**Response (200):**
```json
{
  "_id": "team_xyz789",
  "name": "새 팀이름",
  "description": "새 설명",
  "adminId": "usr_abc123",
  "memberIds": ["usr_1", "usr_3"],
  "inviteCode": "X7K2M9",
  "updatedAt": "2026-02-20T15:00:00Z"
}
```

#### 팀 멤버 조회 `GET /collections/users`

bkend.ai의 collection find를 사용하여 memberIds에 해당하는 사용자들을 조회.

**Response:**
```json
[
  {
    "_id": "usr_abc123",
    "name": "태은",
    "email": "admin@team.com",
    "role": "admin",
    "profileImage": null,
    "createdAt": "2026-02-20T10:00:00Z"
  },
  {
    "_id": "usr_member01",
    "name": "김팀원",
    "email": "member@team.com",
    "role": "member",
    "createdAt": "2026-02-20T11:00:00Z"
  }
]
```

---

## 5. UI/UX Design

### 5.1 팀 관리 페이지 (`/team`)

```
┌────────────────────────────────────────────────────┐
│  👥 팀 관리                                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────┐ ┌──────────────────────┐ │
│  │ 📋 초대 코드          │ │ ⚙️ 팀 설정 (admin)   │ │
│  │                      │ │                      │ │
│  │  A 3 F 7 K 2         │ │  팀 이름: [우리팀  ] │ │
│  │                      │ │  설명:   [자료 공유 ] │ │
│  │  [📋 복사] [🔄 재생성]│ │  [저장]              │ │
│  └──────────────────────┘ └──────────────────────┘ │
│                                                    │
│  👥 팀 멤버 (3명)                                   │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🟢 태은        admin@team.com     👑 관리자    │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 🔵 김팀원      kim@team.com       멤버   [추방]│ │
│  ├────────────────────────────────────────────────┤ │
│  │ 🟣 박팀원      park@team.com      멤버   [추방]│ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🔴 위험 영역                                    │ │
│  │ [팀 나가기]  (member) / [팀 삭제] (admin)       │ │
│  └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### 5.2 모바일 레이아웃

```
┌──────────────────────┐
│  👥 팀 관리           │
├──────────────────────┤
│ 초대 코드             │
│  A 3 F 7 K 2         │
│  [📋 복사] [🔄 재생성]│
├──────────────────────┤
│ 팀 멤버 (3명)         │
│ ┌──────────────────┐ │
│ │🟢 태은  👑 관리자 │ │
│ │   admin@team.com │ │
│ ├──────────────────┤ │
│ │🔵 김팀원    멤버  │ │
│ │   kim@team.com   │ │
│ │          [추방]  │ │
│ └──────────────────┘ │
├──────────────────────┤
│ ⚙️ 팀 설정 (admin)   │
│ 팀 이름: [우리팀    ]│
│ 설명:   [자료 공유  ]│
│ [저장]               │
├──────────────────────┤
│ [팀 나가기/삭제]      │
├──────────────────────┤
│ 📊  💬  📁  👥  ⚙️  │
└──────────────────────┘
```

### 5.3 확인 다이얼로그

```
┌─────────────────────────────┐
│  ⚠️ 멤버 추방                │
│                             │
│  "김팀원"님을 팀에서          │
│  추방하시겠습니까?            │
│                             │
│  추방된 멤버는 초대 코드로     │
│  다시 합류할 수 있습니다.      │
│                             │
│  [취소]          [추방하기]   │
└─────────────────────────────┘

┌─────────────────────────────┐
│  🔴 팀 삭제                  │
│                             │
│  "우리팀"을 삭제하시겠습니까?  │
│                             │
│  이 작업은 되돌릴 수 없으며,   │
│  모든 팀 데이터가 삭제됩니다.  │
│                             │
│  확인하려면 팀 이름을 입력:    │
│  [                        ] │
│                             │
│  [취소]          [삭제하기]   │
└─────────────────────────────┘
```

---

## 6. Component Specification

### 6.1 Component List

| Component | Location | Type | Responsibility |
|-----------|----------|------|----------------|
| `TeamPage` | `src/app/(main)/team/page.tsx` | **신규** | 팀 관리 페이지 (조립) |
| `MemberList` | `src/components/features/team/MemberList.tsx` | **신규** | 멤버 목록 |
| `MemberCard` | `src/components/features/team/MemberCard.tsx` | **신규** | 개별 멤버 카드 |
| `InviteCodeCard` | `src/components/features/team/InviteCodeCard.tsx` | **신규** | 초대코드 표시/복사 |
| `TeamSettings` | `src/components/features/team/TeamSettings.tsx` | **신규** | 팀 설정 (수정/삭제/나가기) |
| `Sidebar` | `src/components/features/layout/Sidebar.tsx` | **수정** | 팀 메뉴 항목 추가 |
| `MobileNav` | `src/components/features/layout/MobileNav.tsx` | **수정** | 팀 메뉴 항목 추가 |
| `useTeam` | `src/hooks/useTeam.ts` | **수정** | 멤버 조회, CRUD 메서드 추가 |
| `types/index.ts` | `src/types/index.ts` | **수정** | TeamMember 타입 추가 |

### 6.2 Component Props & State

#### MemberCard

```typescript
interface MemberCardProps {
  member: TeamMember;
  isCurrentUser: boolean;  // 자기 자신 여부
  canManage: boolean;      // 관리자이고 자기 자신이 아닌 경우
  onRemove: (memberId: string) => void;
}
```

**State**: 없음 (stateless)

#### MemberList

```typescript
interface MemberListProps {
  members: TeamMember[];
  currentUserId: string;
  isAdmin: boolean;
  onRemoveMember: (memberId: string) => void;
}
```

**State**: 없음 (stateless)

#### InviteCodeCard

```typescript
interface InviteCodeCardProps {
  inviteCode: string;
  isAdmin: boolean;
  onRegenerate: () => void;
  isRegenerating: boolean;
}
```

**State**:
- `copied: boolean` — 복사 성공 피드백 (2초 후 리셋)

#### TeamSettings

```typescript
interface TeamSettingsProps {
  team: Team;
  isAdmin: boolean;
  onUpdateTeam: (data: { name: string; description: string }) => void;
  onLeaveTeam: () => void;
  onDeleteTeam: () => void;
  isUpdating: boolean;
  isLeaving: boolean;
  isDeleting: boolean;
}
```

**State**:
- `name: string` — 팀 이름 편집
- `description: string` — 팀 설명 편집
- `showDeleteConfirm: boolean` — 삭제 확인 모달
- `showLeaveConfirm: boolean` — 나가기 확인 모달
- `deleteConfirmName: string` — 삭제 확인용 팀 이름 입력

---

## 7. Hook API Design

### 7.1 useTeam Hook (확장)

```typescript
interface UseTeamReturn {
  // 기존 (유지)
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  teamId: string;

  // 신규 추가
  members: TeamMember[];
  isMembersLoading: boolean;

  updateTeam: (data: { name?: string; description?: string }) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  deleteTeam: () => Promise<void>;
  regenerateInviteCode: () => Promise<string>;

  isUpdating: boolean;
  isRemoving: boolean;
  isLeaving: boolean;
  isDeleting: boolean;
  isRegenerating: boolean;
}
```

### 7.2 구현 전략

```typescript
export function useTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // 기존: 팀 목록 조회
  const { data: teams = [], isLoading } = useQuery({ ... });

  const currentTeam = teams[0] || null;

  // 신규: 멤버 상세 조회
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['team-members', currentTeam?._id],
    queryFn: async () => {
      if (!currentTeam) return [];
      const users = await bkend.collection('users').find({});
      return (users as User[])
        .filter(u => currentTeam.memberIds.includes(u._id))
        .map(u => ({
          ...u,
          isAdmin: u._id === currentTeam.adminId,
          joinedAt: u.createdAt,
        }));
    },
    enabled: !!currentTeam,
  });

  // 신규: 팀 정보 수정
  const updateTeamMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      return bkend.collection('teams').update(currentTeam!._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  // 신규: 멤버 추방
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const newMemberIds = currentTeam!.memberIds.filter(id => id !== memberId);
      return bkend.collection('teams').update(currentTeam!._id, {
        memberIds: newMemberIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  // 신규: 팀 나가기
  const leaveTeamMutation = useMutation({
    mutationFn: async () => {
      const newMemberIds = currentTeam!.memberIds.filter(id => id !== user!._id);
      return bkend.collection('teams').update(currentTeam!._id, {
        memberIds: newMemberIds,
      });
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });

  // 신규: 팀 삭제
  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      return bkend.collection('teams').delete(currentTeam!._id);
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });

  // 신규: 초대코드 재생성
  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await bkend.collection('teams').update(currentTeam!._id, {
        inviteCode: newCode,
      });
      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  return {
    teams, currentTeam, isLoading, teamId: currentTeam?._id || '',
    members, isMembersLoading,
    updateTeam: updateTeamMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    leaveTeam: leaveTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,
    regenerateInviteCode: regenerateCodeMutation.mutateAsync,
    isUpdating: updateTeamMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
    isLeaving: leaveTeamMutation.isPending,
    isDeleting: deleteTeamMutation.isPending,
    isRegenerating: regenerateCodeMutation.isPending,
  };
}
```

---

## 8. Error Handling

| 상황 | 처리 |
|------|------|
| 멤버 목록 로딩 실패 | "멤버 목록을 불러올 수 없습니다" Toast + 재시도 버튼 |
| 멤버 추방 실패 | "멤버 추방에 실패했습니다" Toast |
| 팀 나가기 실패 | "팀 나가기에 실패했습니다" Toast |
| 팀 삭제 실패 | "팀 삭제에 실패했습니다" Toast |
| 팀 정보 수정 실패 | "팀 정보 수정에 실패했습니다" Toast |
| 초대코드 재생성 실패 | "초대코드 재생성에 실패했습니다" Toast |
| 권한 없음 (403) | "관리자 권한이 필요합니다" Toast |

---

## 9. Security Considerations

- 관리자 전용 기능은 `useAuth().isAdmin` 체크로 UI 숨김
- 서버 사이드에서도 bkend.ai 권한 체크 (adminId 비교)
- 팀 삭제 시 이중 확인 (팀 이름 직접 입력)
- 자기 자신은 추방 불가 (UI에서 차단)
- 관리자는 팀 나가기 불가 (팀 삭제만 가능)

---

## 10. Implementation Order

```
Step 1: types/index.ts 수정 — TeamMember 타입 추가
Step 2: useTeam.ts 확장 — members 조회 + mutation 메서드 추가
Step 3: MemberCard.tsx 생성 — Avatar + 이름 + 역할 + 추방 버튼
Step 4: MemberList.tsx 생성 — MemberCard 목록 렌더링
Step 5: InviteCodeCard.tsx 생성 — 초대코드 표시 + 복사 + 재생성
Step 6: TeamSettings.tsx 생성 — 팀 정보 수정 + 나가기/삭제
Step 7: /team 페이지 조립 — 컴포넌트 배치
Step 8: Sidebar.tsx + MobileNav.tsx 수정 — 팀 메뉴 추가
```

---

## 11. Test Plan

### 11.1 수동 테스트 시나리오

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | `/team` 페이지 접속 | 멤버 목록 + 초대코드 표시 |
| 2 | 초대코드 복사 버튼 클릭 | 클립보드에 복사, "복사됨" 피드백 |
| 3 | (admin) 팀 이름 수정 후 저장 | Toast 성공, Sidebar 이름 갱신 |
| 4 | (admin) 멤버 추방 → 확인 | 멤버 목록에서 제거 |
| 5 | (admin) 초대코드 재생성 | 새 코드 표시 |
| 6 | (member) 팀 나가기 → 확인 | /login 리다이렉트 |
| 7 | (admin) 팀 삭제 → 이름 입력 → 확인 | /login 리다이렉트 |
| 8 | (member) 추방/삭제 버튼 보이지 않음 | admin 전용 UI 숨김 |
| 9 | 모바일에서 `/team` 접속 | 반응형 레이아웃 정상 |

### 11.2 빌드 검증

```bash
npm run build
npm run lint
```

---

## 12. Clean Architecture Compliance

| Layer | Component | Location |
|-------|-----------|----------|
| **Presentation** | TeamPage, MemberList, MemberCard, InviteCodeCard, TeamSettings | `src/app/`, `src/components/features/team/` |
| **Application** | useTeam (확장) | `src/hooks/useTeam.ts` |
| **Domain** | Team, User, TeamMember 타입 | `src/types/index.ts` |
| **Infrastructure** | bkend.collection CRUD | `src/lib/bkend.ts` |

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑           ↑
  TeamPage     useTeam     TeamMember    bkend.ts
  MemberList   mutations   Team type     API calls
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial design — 9개 컴포넌트, useTeam 확장 설계 | 태은 |
