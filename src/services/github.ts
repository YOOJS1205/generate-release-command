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

      if (pr.data.merged && pr.data.merge_commit_sha) {
        return {
          sha: pr.data.merge_commit_sha,
          message: pr.data.title,
          date: pr.data.merged_at || new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error("PR 정보 가져오기 실패:", error);
      throw error;
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
