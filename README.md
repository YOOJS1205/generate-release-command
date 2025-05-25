# generate-release-command

Notion 릴리즈 노트에 기재된 Githb PR 링크를 기반으로 git revert/cherry-pick 명령어를 자동으로 생성하는 CLI 도구입니다.

## 설치

```bash
yarn add generate-release-command -D
```

## 설정

`.env` 파일을 생성하고 다음 변수들을 설정합니다:
환경변수 키 값들은 슬랙 채널에 따로 공유드릴게요!

```
NOTION_API_KEY=your-notion-api-key
GITHUB_KEY=your-github-token
```

## 사용 방법

### 기본 사용

```bash
generate-release-command "https://your-notion-page-url"
```

### 옵션

- `-t, --type <type>`: 생성할 명령어 타입 지정 (revert, cherry-pick, both)

  ```bash
  # revert 명령어만 생성
  generate-release-command "https://your-notion-page-url" -t revert

  # cherry-pick 명령어만 생성
  generate-release-command "https://your-notion-page-url" -t cherry-pick
  ```

## 예시 출력

_Revert 명령어:_

```
git revert abc123 def456
```

_Cherry-pick 명령어:_

```
git cherry-pick abc123 def456
```
