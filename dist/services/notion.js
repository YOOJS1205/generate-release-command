"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionService = void 0;
const client_1 = require("@notionhq/client");
class NotionService {
    constructor(apiKey) {
        this.client = new client_1.Client({ auth: apiKey });
    }
    extractPageId(url) {
        const matches = url.match(/([a-zA-Z0-9]{32})/);
        return matches ? matches[1] : null;
    }
    /**
     * 페이지네이션을 처리하여 모든 하위 블록을 가져옵니다
     */
    async getAllChildBlocks(blockId) {
        const allBlocks = [];
        let cursor = undefined;
        let hasMore = true;
        let pageCount = 0;
        while (hasMore) {
            const response = await this.client.blocks.children.list({
                block_id: blockId,
                start_cursor: cursor,
                page_size: 100, // 최대 100개씩 가져오기
            });
            allBlocks.push(...response.results);
            hasMore = response.has_more;
            cursor = response.next_cursor || undefined;
            pageCount++;
        }
        // 디버깅: 페이지네이션이 발생했는지 확인
        if (pageCount > 1) {
            console.log(`  [디버그] 블록 ${blockId.substring(0, 8)}...: ${pageCount}페이지, 총 ${allBlocks.length}개 블록`);
        }
        return allBlocks;
    }
    async extractPrLinksFromBlocks(blocks) {
        let prLinks = [];
        const childBlockPromises = [];
        for (const block of blocks) {
            // 1. rich_text가 있는 블록에서 링크 추출
            const richText = block.paragraph?.rich_text ||
                block.to_do?.rich_text ||
                block.bulleted_list_item?.rich_text ||
                block.numbered_list_item?.rich_text ||
                block.heading_1?.rich_text ||
                block.heading_2?.rich_text ||
                block.heading_3?.rich_text;
            if (Array.isArray(richText)) {
                for (const t of richText) {
                    if (t.href && t.href.startsWith(process.env.GITHUB_PR_LINK)) {
                        prLinks.push(t.href);
                    }
                    if (t.plain_text) {
                        // GitHub URL을 환경 변수에서 가져와서 정규 표현식 생성
                        const githubUrl = process.env.GITHUB_PR_LINK.replace(/\/$/, ""); // 마지막 슬래시 제거
                        const regex = new RegExp(`${githubUrl}/pull/\\d+`, "g");
                        const matches = t.plain_text.match(regex);
                        if (matches)
                            prLinks.push(...matches);
                    }
                }
            }
            // 2. url 속성이 있는 블록(링크 미리보기 등)
            if ("url" in block &&
                typeof block.url === "string" &&
                block.url.startsWith(process.env.GITHUB_PR_LINK)) {
                prLinks.push(block.url);
            }
            // 3. 하위 블록이 있으면 병렬로 탐색 (페이지네이션 처리)
            if (block.has_children) {
                const childPromise = this.getAllChildBlocks(block.id).then((childBlocks) => this.extractPrLinksFromBlocks(childBlocks));
                childBlockPromises.push(childPromise);
            }
        }
        // 모든 하위 블록 요청을 병렬로 처리
        const childLinksArrays = await Promise.all(childBlockPromises);
        for (const childLinks of childLinksArrays) {
            prLinks = prLinks.concat(childLinks);
        }
        // 중복 제거
        return Array.from(new Set(prLinks));
    }
    async getPageContent(pageId) {
        try {
            // 페이지네이션을 처리하여 모든 블록 가져오기
            const allBlocks = await this.getAllChildBlocks(pageId);
            // 모든 블록에서 PR 링크 추출 (재귀)
            const allLinks = await this.extractPrLinksFromBlocks(allBlocks);
            const prLinks = Array.from(new Set(allLinks.filter((link) => link.includes(process.env.GITHUB_PR_LINK))));
            return prLinks;
        }
        catch (error) {
            console.error("Notion 페이지 가져오기 실패:", error);
            throw error;
        }
    }
}
exports.NotionService = NotionService;
