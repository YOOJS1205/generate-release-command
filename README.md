# generate-release-command

Notion 릴리즈 노트에서 git revert/cherry-pick 명령어를 자동으로 생성하는 CLI 도구입니다.

## 설치

```bash
npm install -g generate-release-command
```

## 설정

`.env` 파일을 생성하고 다음 변수들을 설정합니다:

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

```
*Revert 명령어:*
```

git revert abc123 # PR 제목 1
git revert def456 # PR 제목 2

```

*Cherry-pick 명령어:*
```

git cherry-pick abc123 # PR 제목 1
git cherry-pick def456 # PR 제목 2

```

```
