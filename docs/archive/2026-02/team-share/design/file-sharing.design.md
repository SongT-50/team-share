# File Sharing Design Document

> **Summary**: 자료/사진 업로드 및 공유 기능 완성 — 삭제, 검색, 태그, 드래그&드롭, 정렬
>
> **Project**: team-share
> **Feature**: file-sharing
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **Planning Doc**: [file-sharing.plan.md](../../01-plan/features/file-sharing.plan.md)
> **PDCA Cycle**: #3

---

## 1. Overview

### 1.1 Design Goals

- **기존 코드 확장**: 신규 파일 최소화, 기존 5개 파일을 수정하여 기능 보강
- **검색+필터+정렬**: 자료가 많아져도 원하는 파일을 빠르게 찾는 UX
- **드래그&드롭**: 데스크톱에서 직관적 업로드 경험 (모바일은 기존 클릭 유지)
- **권한 기반 삭제**: 업로더 본인 또는 관리자만 삭제 가능

### 1.2 Design Principles

- **점진적 개선**: 기존 동작을 깨지 않으면서 기능 추가
- **클라이언트 사이드 검색/정렬**: 현재 규모(팀당 수십~수백 파일)에 적합
- **Debounce 검색**: 300ms 딜레이로 타이핑 중 불필요한 렌더링 방지

---

## 2. Architecture

### 2.1 Data Flow

```
[업로드 Flow] (확장: 드래그&드롭 + 태그)
드래그 or 클릭 → 파일 선택 → 제목/태그 입력 → bkend.upload → shared-files.create → 목록 갱신

[검색/정렬 Flow] (신규)
검색어 입력 (debounce 300ms) → 클라이언트 필터 → FileList 렌더링
정렬 선택 → 클라이언트 정렬 → FileList 렌더링

[삭제 Flow] (신규)
삭제 버튼 → 확인 Modal → useFiles.deleteFile → bkend.delete → 목록 갱신

[수정 Flow] (신규)
편집 모드 → 제목/설명/태그 수정 → useFiles.updateFile → bkend.update → 상세 갱신
```

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────┐
│  /files (FilesPage)                                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │  FileUploader (수정)                             │ │
│  │  - 기존 클릭 업로드 유지                          │ │
│  │  + 드래그&드롭 영역                              │ │
│  │  + 태그 입력 (콤마 구분)                          │ │
│  ├─────────────────────────────────────────────────┤ │
│  │  검색바 + 정렬 드롭다운 (FilesPage에서 관리)      │ │
│  ├─────────────────────────────────────────────────┤ │
│  │  FileList (수정)                                 │ │
│  │  - 기존 타입 필터 유지                            │ │
│  │  + 검색 결과 반영                                │ │
│  │  + 정렬 적용                                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │ │
│  │  │FileCard  │ │FileCard  │ │FileCard  │         │ │
│  │  └──────────┘ └──────────┘ └──────────┘         │ │
│  ├─────────────────────────────────────────────────┤ │
│  │  FileDetail (수정) — Modal                       │ │
│  │  - 기존 미리보기/다운로드 유지                     │ │
│  │  + 편집 모드 (제목/설명/태그)                     │ │
│  │  + 삭제 버튼 (업로더/관리자)                      │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 기존 타입 (변경 없음)

```typescript
// types/index.ts — 이미 존재, 수정 불필요
interface SharedFile extends BaseDocument {
  teamId: string;
  uploaderId: string;
  uploaderName: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'image' | 'document' | 'video' | 'other';
  fileName: string;
  fileSize: number;
  tags: string[];
}
```

### 3.2 신규 타입 (없음)

기존 SharedFile 타입이 description, tags 필드를 이미 포함하므로 추가 타입 불필요.

---

## 4. API Specification

### 4.1 사용할 API

| Method | Endpoint | 용도 | 변경 |
|--------|----------|------|:----:|
| GET | `/collections/shared-files?teamId=` | 파일 목록 조회 | 기존 |
| POST | `/files/upload` | 파일 업로드 | 기존 |
| POST | `/collections/shared-files` | 파일 메타데이터 생성 | 기존 |
| PUT | `/collections/shared-files/:id` | 파일 정보 수정 | **신규** |
| DELETE | `/collections/shared-files/:id` | 파일 삭제 | **신규** |

### 4.2 신규 API 상세

#### `PUT /collections/shared-files/:id`

**Request:**
```json
{
  "title": "수정된 제목",
  "description": "새로운 설명",
  "tags": ["회의록", "2월"]
}
```

**Response (200):** 수정된 SharedFile 객체

#### `DELETE /collections/shared-files/:id`

**Response (200):** `{ "deleted": true }`

---

## 5. UI/UX Design

### 5.1 Files 페이지 (확장)

```
┌────────────────────────────────────────────────────┐
│  📁 자료 공유                                       │
├────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐ │
│  │           드래그&드롭 영역                       │ │
│  │      ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈              │ │
│  │      📎 파일을 여기에 끌어다 놓으세요             │ │
│  │         또는 [파일 선택] 클릭                    │ │
│  │      ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈              │ │
│  │  (파일 선택 후)                                  │ │
│  │  📄 report.pdf (2.3 MB)                        │ │
│  │  제목: [2월 회의록        ]                      │ │
│  │  태그: [회의록, 2월       ] (콤마 구분)           │ │
│  │  [업로드]  [취소]                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  [🔍 검색...              ]  정렬: [최신순 ▾]       │
│                                                    │
│  [전체] [이미지] [문서] [동영상] [기타]              │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 📄 2월   │ │ 🖼️ 시안  │ │ 📄 견적서│           │
│  │ 회의록   │ │ v2.png   │ │ .xlsx    │           │
│  │ 2.3 MB   │ │ 1.1 MB   │ │ 0.5 MB   │           │
│  │ 태은     │ │ 박팀원   │ │ 김팀원    │           │
│  └──────────┘ └──────────┘ └──────────┘           │
└────────────────────────────────────────────────────┘
```

### 5.2 FileDetail 모달 (확장)

```
┌─────────────────────────────┐
│  2월 회의록          [✏️][🗑️]│
├─────────────────────────────┤
│  (이미지면 미리보기)          │
│                             │
│  파일명: report.pdf          │
│  크기:   2.3 MB              │
│  업로더: 태은                │
│  일시:   2026. 2. 20 14:30  │
│  태그:   회의록 | 2월         │
│  설명:   2월 정기 회의 내용   │
│                             │
│  [다운로드]                  │
│                             │
│  ─── 편집 모드 (✏️ 클릭 시) ─│
│  제목: [2월 회의록         ] │
│  설명: [2월 정기 회의 내용 ] │
│  태그: [회의록, 2월        ] │
│  [저장]  [취소]              │
└─────────────────────────────┘
```

### 5.3 삭제 확인 다이얼로그

```
┌─────────────────────────────┐
│  파일 삭제                   │
│                             │
│  "2월 회의록"을              │
│  삭제하시겠습니까?            │
│                             │
│  이 작업은 되돌릴 수 없습니다.│
│                             │
│  [취소]          [삭제하기]   │
└─────────────────────────────┘
```

### 5.4 드래그 상태 (isDragging)

```
┌────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐ │
│  │  ████████████████████████████████████████████  │ │
│  │  █                                          █  │ │
│  │  █    📎 여기에 놓으면 업로드됩니다            █  │ │
│  │  █                                          █  │ │
│  │  ████████████████████████████████████████████  │ │
│  └────────────────────────────────────────────────┘ │
│  (border: blue dashed, bg: blue-50)                │
└────────────────────────────────────────────────────┘
```

---

## 6. Component Specification

### 6.1 수정할 파일 목록

| Component | Location | 변경 내용 |
|-----------|----------|----------|
| `useFiles` | `src/hooks/useFiles.ts` | deleteFile, updateFile mutation 추가, 에러/refetch 노출 |
| `FileUploader` | `src/components/features/files/FileUploader.tsx` | 드래그&드롭, 태그 입력 필드 추가 |
| `FileList` | `src/components/features/files/FileList.tsx` | 정렬 prop 수신, 외부 검색 결과 반영 |
| `FileDetail` | `src/components/features/files/FileDetail.tsx` | 편집 모드, 삭제 버튼 추가 |
| `FilesPage` | `src/app/(main)/files/page.tsx` | 검색 상태, 정렬 상태, 에러 UI 추가 |

### 6.2 useFiles Hook (확장)

```typescript
interface UseFilesReturn {
  // 기존 (유지)
  files: SharedFile[];
  isLoading: boolean;
  refresh: () => void;

  // 신규 추가
  isError: boolean;
  refetch: () => void;
  deleteFile: (fileId: string) => Promise<void>;
  updateFile: (fileId: string, data: Partial<SharedFile>) => Promise<void>;
  isDeleting: boolean;
  isUpdating: boolean;
}
```

### 6.3 FileUploader Props (변경)

```typescript
// 기존
interface FileUploaderProps {
  teamId: string;
  onUploaded: (file: SharedFile) => void;
}

// 변경 없음 — 내부적으로 드래그&드롭 + 태그 입력 추가
// 기존 Props 인터페이스 유지, 내부 State만 확장:
// + isDragging: boolean
// + tags: string (콤마 구분 문자열)
```

### 6.4 FileList Props (변경)

```typescript
interface FileListProps {
  files: SharedFile[];       // 기존
  isLoading: boolean;        // 기존
  searchQuery: string;       // 신규: 외부에서 전달받는 검색어
  sortBy: SortOption;        // 신규: 외부에서 전달받는 정렬 기준
}

type SortOption = 'newest' | 'oldest' | 'name' | 'size';
```

### 6.5 FileDetail Props (변경)

```typescript
interface FileDetailProps {
  file: SharedFile;          // 기존
  onClose: () => void;       // 기존
  canEdit: boolean;          // 신규: 업로더 본인 여부
  canDelete: boolean;        // 신규: 업로더 본인 또는 관리자
  onUpdate: (fileId: string, data: Partial<SharedFile>) => Promise<void>;  // 신규
  onDelete: (fileId: string) => Promise<void>;  // 신규
  isUpdating: boolean;       // 신규
  isDeleting: boolean;       // 신규
}

// 내부 State:
// + isEditing: boolean — 편집 모드 토글
// + editTitle: string
// + editDescription: string
// + editTags: string (콤마 구분)
// + showDeleteConfirm: boolean
```

---

## 7. Error Handling

| 상황 | 처리 |
|------|------|
| 파일 목록 조회 실패 | "자료를 불러올 수 없습니다" + "다시 시도" 버튼 |
| 파일 업로드 실패 | "업로드에 실패했습니다" Toast (기존) |
| 파일 삭제 실패 | "파일 삭제에 실패했습니다" Toast |
| 파일 수정 실패 | "파일 정보 수정에 실패했습니다" Toast |
| 10MB 초과 | "파일 크기는 10 MB 이하여야 합니다" Toast (기존) |

---

## 8. Security Considerations

- 삭제 권한: `file.uploaderId === user._id || isAdmin`
- 수정 권한: `file.uploaderId === user._id` (업로더 본인만)
- 파일 접근: teamId 기반 격리 (bkend.ai 서버 사이드)

---

## 9. Implementation Order

```
Step 1: useFiles.ts 확장 — deleteFile, updateFile, isError, refetch
Step 2: FileUploader.tsx 수정 — 드래그&드롭 + 태그 입력
Step 3: FileList.tsx 수정 — searchQuery/sortBy prop, 클라이언트 필터/정렬
Step 4: FileDetail.tsx 수정 — 편집 모드 + 삭제 기능
Step 5: files/page.tsx 수정 — 검색 상태 + 정렬 상태 + 에러 UI
Step 6: 빌드 검증
```

---

## 10. Test Plan

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | 파일 드래그&드롭 | 드래그 영역 하이라이트, 드롭 시 파일 선택됨 |
| 2 | 태그 입력 후 업로드 | 파일 카드에 태그 표시 |
| 3 | 검색어 입력 | 제목/파일명 일치 파일만 표시 |
| 4 | 정렬 변경 | 선택 기준에 따라 목록 재정렬 |
| 5 | 파일 상세에서 편집 | 제목/설명/태그 수정 후 저장 |
| 6 | 파일 삭제 (업로더) | 확인 후 목록에서 제거 |
| 7 | 파일 삭제 (관리자) | 다른 사람 파일도 삭제 가능 |
| 8 | 에러 상태 | "다시 시도" 버튼 표시 |
| 9 | 10MB 초과 드래그 | 에러 Toast |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial design — 5개 파일 수정 설계 | 태은 |
