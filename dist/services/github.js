"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const octokit_1 = require("octokit");
class GitHubService {
    constructor(token) {
        this.octokit = new octokit_1.Octokit({ auth: token });
    }
    extractPrInfo(prUrl) {
        const matches = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
        if (!matches)
            return null;
        return {
            owner: matches[1],
            repo: matches[2],
            prNumber: parseInt(matches[3]),
        };
    }
    async getSquashMergeCommit(owner, repo, prNumber) {
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
        }
        catch (error) {
            console.error("PR 정보 가져오기 실패:", error);
            throw error;
        }
    }
    sortCommitsByDate(commits) {
        return [...commits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    sortCommitsByDateDesc(commits) {
        return [...commits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
}
exports.GitHubService = GitHubService;
