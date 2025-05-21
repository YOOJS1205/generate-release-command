const { Octokit } = require("octokit");

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  // PR URL에서 owner, repo, pr number 추출
  extractPrInfo(prUrl) {
    const matches = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!matches) return null;

    return {
      owner: matches[1],
      repo: matches[2],
      prNumber: parseInt(matches[3]),
    };
  }

  // PR의 squash merge 커밋 가져오기
  async getSquashMergeCommit(owner, repo, prNumber) {
    try {
      const pr = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      // PR이 squash merge 되었는지 확인
      if (pr.data.merged && pr.data.merge_commit_sha) {
        return {
          sha: pr.data.merge_commit_sha,
          message: pr.data.title,
          date: pr.data.merged_at,
        };
      }

      return null;
    } catch (error) {
      console.error("PR 정보 가져오기 실패:", error);
      throw error;
    }
  }

  // 커밋들을 시간순으로 정렬
  sortCommitsByDate(commits) {
    return commits.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}

module.exports = GitHubService;
