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
    async getPageContent(pageId) {
        try {
            const page = await this.client.pages.retrieve({ page_id: pageId });
            const blocks = await this.client.blocks.children.list({
                block_id: pageId,
            });
            const prLinks = [];
            for (const block of blocks.results) {
                if (this.isParagraphBlock(block)) {
                    const text = block.paragraph.rich_text
                        .map((t) => t.plain_text)
                        .join("");
                    const githubPrRegex = /https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/g;
                    const matches = text.match(githubPrRegex);
                    if (matches) {
                        prLinks.push(...matches);
                    }
                }
            }
            return prLinks;
        }
        catch (error) {
            console.error("Notion 페이지 가져오기 실패:", error);
            throw error;
        }
    }
    isParagraphBlock(block) {
        return ("type" in block && block.type === "paragraph" && "paragraph" in block);
    }
}
exports.NotionService = NotionService;
