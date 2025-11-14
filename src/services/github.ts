import { Octokit } from "octokit";

interface PrInfo {
  owner: string;
  repo: string;
  prNumber: number;
}

interface Commit {
  sha: string;
  message: string;
  date: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  extractPrInfo(prUrl: string): PrInfo | null {
    const matches = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!matches) return null;

    return {
      owner: matches[1],
      repo: matches[2],
      prNumber: parseInt(matches[3]),
    };
  }

  async getSquashMergeCommit(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<Commit | null> {
    try {
      const pr = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      if (!pr.data.merged) {
        console.warn(`PR #${prNumber} (${pr.data.html_url})는 아직 merge되지 않았습니다.`);
        return null;
      }

      // Squash merge 또는 Merge commit의 경우
      if (pr.data.merge_commit_sha) {
        return {
          sha: pr.data.merge_commit_sha,
          message: pr.data.title,
          date: pr.data.merged_at || new Date().toISOString(),
        };
      }

      // Rebase merge의 경우 merge_commit_sha가 없을 수 있음
      // 이 경우 PR의 head SHA를 사용하거나 커밋 목록에서 찾아야 함
      if (pr.data.head && pr.data.head.sha) {
        // Rebase merge의 경우 head SHA가 base branch에 직접 적용됨
        // 하지만 정확한 merge commit을 찾기 위해 커밋 목록을 확인
        const commits = await this.octokit.rest.pulls.listCommits({
          owner,
          repo,
          pull_number: prNumber,
        });

        if (commits.data.length > 0) {
          // 마지막 커밋을 사용 (rebase merge의 경우)
          const lastCommit = commits.data[commits.data.length - 1];
          return {
            sha: lastCommit.sha,
            message: pr.data.title,
            date: pr.data.merged_at || new Date().toISOString(),
          };
        }
      }

      console.warn(`PR #${prNumber} (${pr.data.html_url})의 커밋 정보를 찾을 수 없습니다. (merged: ${pr.data.merged}, merge_commit_sha: ${pr.data.merge_commit_sha})`);
      return null;
    } catch (error: any) {
      // 404 에러는 PR이 존재하지 않는 경우이므로 경고만 출력
      if (error.status === 404) {
        console.warn(`PR #${prNumber} (${owner}/${repo})를 찾을 수 없습니다.`);
        return null;
      }
      console.error(`PR #${prNumber} (${owner}/${repo}) 정보 가져오기 실패:`, error.message || error);
      // 에러를 throw하지 않고 null을 반환하여 다른 PR 처리를 계속할 수 있도록 함
      return null;
    }
  }

  sortCommitsByDate(commits: Commit[]): Commit[] {
    return [...commits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  sortCommitsByDateDesc(commits: Commit[]): Commit[] {
    return [...commits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}
