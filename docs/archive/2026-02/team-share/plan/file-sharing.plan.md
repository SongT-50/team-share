# File Sharing Planning Document

> **Summary**: 자료/사진 업로드 및 공유 기능 완성 — 삭제, 검색, 태그, 드래그&드롭, 정렬
>
> **Project**: team-share
> **Feature**: file-sharing
> **Version**: 0.1.0
> **Author**: 태은
> **Date**: 2026-02-20
> **Status**: Draft
> **PDCA Cycle**: #3

---

## 1. Overview

### 1.1 Purpose

Cycle #1에서 파일 업로드/목록/상세보기의 기본 뼈대가 구현되었으나, 실제 사용에 필요한 **파일 삭제, 검색, 태그 관리, 드래그&드롭** 등이 부재함. 이 기능을 완성하여 팀 자료 공유의 핵심 UX를 확보한다.

### 1.2 현재 상태 (Cycle #1 결과물)

| 항목 | 상태 | 파일 |
|------|:----:|------|
| FileUploader (클릭 선택, 10MB 제한) | ✅ 존재 | `FileUploader.tsx` |
| FileList (필터: 유형별) | ✅ 존재 | `FileList.tsx` |
| FileCard (아이콘, 이름, 크기, 업로더, 태그) | ✅ 존재 | `FileCard.tsx` |
| FileDetail (미리보기, 다운로드) | ✅ 존재 | `FileDetail.tsx` |
| useFiles hook (조회, refresh) | ✅ 존재 | `useFiles.ts` |
| /files 페이지 | ✅ 존재 | `files/page.tsx` |
| utils (formatDate, formatFileSize, getFileType) | ✅ 존재 | `utils.ts` |
| 파일 삭제 | ❌ 없음 | - |
| 파일 검색 (제목/파일명) | ❌ 없음 | - |
| 태그 추가/편집 | ❌ 없음 | - |
| 드래그 & 드롭 업로드 | ❌ 없음 | - |
| 파일 정보 수정 (제목/설명) | ❌ 없음 | - |
| 정렬 (날짜/이름/크기) | ❌ 없음 | - |
| 에러 핸들링 (조회 실패) | ❌ 없음 | - |

---

## 2. Scope

### 2.1 In Scope

- [x] 파일 삭제 (업로더 본인 또는 관리자, 확인 다이얼로그)
- [x] 파일 검색 (제목/파일명 텍스트 검색)
- [x] 태그 추가 (업로드 시 + 상세에서 편집)
- [x] 드래그 & 드롭 업로드 지원
- [x] 파일 정보 수정 (제목, 설명, 태그)
- [x] 정렬 (최신순/이름순/크기순)
- [x] useFiles hook 확장 (삭제, 수정, 에러 상태)
- [x] 에러 핸들링 (조회 실패 시 toast + 재시도)

### 2.2 Out of Scope (v2 이후)

- 다중 파일 동시 업로드
- 파일 버전 관리
- 폴더 구조
- AI 기반 자동 태그 추천
- 파일 내 텍스트 검색 (OCR)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | 의존성 |
|----|-------------|:--------:|--------|
| FS-01 | 파일 삭제 (업로더/관리자, 확인 다이얼로그) | P0 | useFiles, Modal |
| FS-02 | 파일 검색 (제목/파일명) | P0 | - |
| FS-03 | 태그 추가 (업로드 시 태그 입력) | P0 | FileUploader 수정 |
| FS-04 | 드래그 & 드롭 업로드 | P0 | FileUploader 수정 |
| FS-05 | 파일 정보 수정 (제목, 설명, 태그) | P1 | FileDetail 수정 |
| FS-06 | 정렬 (최신순/이름순/크기순) | P1 | FileList 수정 |
| FS-07 | useFiles hook 확장 (delete, update, error) | P0 | useFiles 수정 |
| FS-08 | 에러 핸들링 (조회 실패, 재시도) | P0 | useFiles, files/page |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| UX | 드래그 영역 하이라이트, 업로드 진행 피드백 |
| 보안 | 삭제 권한 체크 (업로더 본인 또는 관리자) |
| 성능 | 파일 목록 로딩 < 1초, 검색 debounce 300ms |

---

## 4. Success Criteria

- [ ] 파일 업로드 (클릭 + 드래그&드롭) 동작
- [ ] 파일 목록에서 검색/필터/정렬 동작
- [ ] 파일 상세에서 정보 수정 및 삭제 동작
- [ ] 업로드 시 태그 입력 가능
- [ ] 에러 상태에서 재시도 버튼 동작
- [ ] 빌드 성공 (`npm run build`)
- [ ] Gap Analysis Match Rate >= 90%

---

## 5. Technical Approach

### 5.1 수정/생성할 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/hooks/useFiles.ts` | **수정** | delete, update mutation, 에러 상태, 검색/정렬 |
| `src/components/features/files/FileUploader.tsx` | **수정** | 드래그&드롭, 태그 입력 추가 |
| `src/components/features/files/FileList.tsx` | **수정** | 검색바, 정렬 드롭다운 추가 |
| `src/components/features/files/FileDetail.tsx` | **수정** | 수정/삭제 버튼, 편집 모드 추가 |
| `src/app/(main)/files/page.tsx` | **수정** | 에러 상태, 검색 상태 연결 |

### 5.2 구현 순서

```
Step 1: useFiles hook 확장 (delete, update, error, refetch)
Step 2: FileUploader 수정 (드래그&드롭, 태그 입력)
Step 3: FileList 수정 (검색바, 정렬)
Step 4: FileDetail 수정 (수정/삭제 기능)
Step 5: files/page 수정 (에러 핸들링, 검색 상태)
Step 6: 빌드 검증
```

---

## 6. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 드래그&드롭 모바일 미지원 | 모바일 UX | 기존 클릭 업로드 유지, 드래그는 데스크톱 보너스 |
| 대량 파일 목록 성능 | 느린 렌더링 | 클라이언트 사이드 필터/검색 (서버 페이지네이션은 v2) |
| 파일 삭제 시 bkend.ai 스토리지 | 파일 잔존 | collection만 삭제 (스토리지 정리는 bkend.ai 자동) |

---

## 7. Next Steps

1. `/pdca design file-sharing` — 상세 설계
2. `/pdca do file-sharing` — 구현

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-20 | Initial draft - Cycle #1 분석 기반 | 태은 |
