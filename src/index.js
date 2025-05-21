const { NotionService } = require("./services/notion");
const { GitHubService } = require("./services/github");
require("dotenv").config();

// 서비스 초기화
const notionService = new NotionService(process.env.NOTION_API_KEY);
const githubService = new GitHubService(process.env.GITHUB_TOKEN);

// 메인 함수
async function generateReleaseCommands(notionUrl) {
  try {
    // 1. Notion 페이지 ID 추출
    const pageId = notionService.extractPageId(notionUrl);
    if (!pageId) {
      return "올바른 Notion 페이지 URL이 아닙니다.";
    }

    // 2. PR 링크 추출
    const prLinks = await notionService.getPageContent(pageId);
    if (prLinks.length === 0) {
      return "PR 링크를 찾을 수 없습니다.";
    }

    // 3. 각 PR의 커밋 정보 가져오기
    const commits = [];
    for (const prUrl of prLinks) {
      const prInfo = githubService.extractPrInfo(prUrl);
      if (prInfo) {
        const commit = await githubService.getSquashMergeCommit(
          prInfo.owner,
          prInfo.repo,
          prInfo.prNumber
        );
        if (commit) {
          commits.push(commit);
        }
      }
    }

    // 4. 커밋 정렬
    const sortedCommits = githubService.sortCommitsByDate(commits);

    // 5. 명령어 생성
    const revertCommands = sortedCommits
      .map((commit) => `git revert ${commit.sha} # ${commit.message}`)
      .join("\n");

    const cherryPickCommands = sortedCommits
      .map((commit) => `git cherry-pick ${commit.sha} # ${commit.message}`)
      .join("\n");

    return `*Revert 명령어:*\n\`\`\`\n${revertCommands}\n\`\`\`\n\n*Cherry-pick 명령어:*\n\`\`\`\n${cherryPickCommands}\n\`\`\``;
  } catch (error) {
    console.error(error);
    return `오류가 발생했습니다: ${error.message}`;
  }
}

// CLI로 실행할 때
if (require.main === module) {
  const notionUrl = process.argv[2];
  if (!notionUrl) {
    console.log("사용법: node src/index.js [Notion 페이지 URL]");
    process.exit(1);
  }

  generateReleaseCommands(notionUrl)
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
}

module.exports = { generateReleaseCommands };
