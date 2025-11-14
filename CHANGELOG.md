# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2025-01-XX

### Fixed
- Notion API 페이지네이션 제한(100개) 문제 해결
  - `getAllChildBlocks` 메서드 추가로 모든 블록을 가져오도록 개선
  - 하위 블록 탐색 시에도 페이지네이션 처리 추가
- Rebase merge 케이스 처리 개선
  - `merge_commit_sha`가 없는 경우 PR 커밋 목록에서 마지막 커밋 사용

### Added
- 상세한 통계 정보 출력 (성공한 커밋 수, 실패한 PR 목록 등)
- 디버깅 로그 추가 (페이지네이션이 발생한 블록 정보 출력)
- 에러 처리 개선: 에러 발생 시에도 다른 PR 처리를 계속하도록 개선

## [1.0.4] - 2025-01-XX

### Fixed
- revert 명령어는 최신순, cherry-pick은 과거순으로 정렬되도록 수정

## [1.0.3] - 2025-01-XX

### Changed
- PR 링크를 환경변수(`GITHUB_PR_LINK`)로 관리하도록 수정

## [1.0.0] - 2025-01-XX

### Added
- Notion 릴리즈 노트에서 GitHub PR 링크 추출 기능
- git revert/cherry-pick 명령어 자동 생성 기능
- 기본 CLI 인터페이스 및 옵션 지원

