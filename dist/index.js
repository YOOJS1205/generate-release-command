#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const notion_1 = require("./services/notion");
const github_1 = require("./services/github");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const program = new commander_1.Command();
program
    .name("generate-release-command")
    .description("Generate git revert/cherry-pick commands from Notion release notes")
    .version("1.0.0")
    .argument("<url>", "Notion page URL")
    .option("-t, --type <type>", "Command type (revert or cherry-pick)", "both")
    .action(async (url, options) => {
    const notionService = new notion_1.NotionService(process.env.NOTION_API_KEY || "");
    const githubService = new github_1.GitHubService(process.env.GITHUB_KEY || "");
    try {
        // 1. Notion 페이지 ID 추출
        const pageId = notionService.extractPageId(url);
        if (!pageId) {
            console.error("올바른 Notion 페이지 URL이 아닙니다.");
            process.exit(1);
        }
        // 2. PR 링크 추출
        const prLinks = await notionService.getPageContent(pageId);
        if (prLinks.length === 0) {
            console.error("PR 링크를 찾을 수 없습니다.");
            process.exit(1);
        }
        // 3. 각 PR의 커밋 정보 가져오기
        const commits = [];
        let failedPrs = [];
        let invalidPrUrls = [];
        console.log(`총 ${prLinks.length}개의 PR 링크를 찾았습니다.`);
        for (const prUrl of prLinks) {
            const prInfo = githubService.extractPrInfo(prUrl);
            if (!prInfo) {
                console.warn(`잘못된 PR URL 형식: ${prUrl}`);
                invalidPrUrls.push(prUrl);
                continue;
            }
            const commit = await githubService.getSquashMergeCommit(prInfo.owner, prInfo.repo, prInfo.prNumber);
            if (commit) {
                commits.push(commit);
            }
            else {
                failedPrs.push(prUrl);
            }
        }
        // 통계 정보 출력
        console.log(`\n처리 결과:`);
        console.log(`  - 성공한 커밋: ${commits.length}개`);
        console.log(`  - 커밋을 찾지 못한 PR: ${failedPrs.length}개`);
        if (failedPrs.length > 0) {
            console.log(`  - 실패한 PR 목록:`);
            failedPrs.forEach((url) => console.log(`    ${url}`));
        }
        if (invalidPrUrls.length > 0) {
            console.log(`  - 잘못된 URL 형식: ${invalidPrUrls.length}개`);
            invalidPrUrls.forEach((url) => console.log(`    ${url}`));
        }
        const commitsForRevert = githubService.sortCommitsByDateDesc(commits);
        const commitsForCherryPick = githubService.sortCommitsByDate(commits);
        if (options.type === "revert" || options.type === "both") {
            const revertCommand = `git revert ${commitsForRevert
                .map((commit) => commit.sha.slice(0, 7))
                .join(" ")}`;
            console.log("\nRevert 명령어:");
            console.log(revertCommand);
        }
        if (options.type === "cherry-pick" || options.type === "both") {
            const cherryPickCommand = `git cherry-pick ${commitsForCherryPick
                .map((commit) => commit.sha.slice(0, 7))
                .join(" ")}`;
            console.log("\nCherry-pick 명령어:");
            console.log(cherryPickCommand);
        }
    }
    catch (error) {
        console.error("오류가 발생했습니다:", error);
        process.exit(1);
    }
});
program.parse();
