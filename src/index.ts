#!/usr/bin/env node

import { Command } from "commander";
import { NotionService } from "./services/notion";
import { GitHubService } from "./services/github";
import dotenv from "dotenv";

dotenv.config();

const program = new Command();

program
  .name("generate-release-command")
  .description(
    "Generate git revert/cherry-pick commands from Notion release notes"
  )
  .version("1.0.0")
  .argument("<url>", "Notion page URL")
  .option("-t, --type <type>", "Command type (revert or cherry-pick)", "both")
  .action(async (url: string, options: { type: string }) => {
    const notionService = new NotionService(process.env.NOTION_API_KEY || "");
    const githubService = new GitHubService(process.env.GITHUB_TOKEN || "");

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
      if (options.type === "revert" || options.type === "both") {
        const revertCommands = sortedCommits
          .map((commit) => `git revert ${commit.sha} # ${commit.message}`)
          .join("\n");
        console.log("\n*Revert 명령어:*");
        console.log("```");
        console.log(revertCommands);
        console.log("```");
      }

      if (options.type === "cherry-pick" || options.type === "both") {
        const cherryPickCommands = sortedCommits
          .map((commit) => `git cherry-pick ${commit.sha} # ${commit.message}`)
          .join("\n");
        console.log("\n*Cherry-pick 명령어:*");
        console.log("```");
        console.log(cherryPickCommands);
        console.log("```");
      }
    } catch (error) {
      console.error("오류가 발생했습니다:", error);
      process.exit(1);
    }
  });

program.parse();
