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
            // 3. 하위 블록이 있으면 병렬로 탐색
            if (block.has_children) {
                const childPromise = this.client.blocks.children
                    .list({ block_id: block.id })
                    .then((childrenResp) => this.extractPrLinksFromBlocks(childrenResp.results));
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
            const blocks = await this.client.blocks.children.list({
                block_id: pageId,
            });
            // 모든 블록에서 PR 링크 추출 (재귀)
            const allLinks = await this.extractPrLinksFromBlocks(blocks.results);
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
