const { Client } = require("@notionhq/client");

class NotionService {
  constructor(apiKey) {
    this.client = new Client({ auth: apiKey });
  }

  // Notion URL에서 페이지 ID 추출
  extractPageId(url) {
    const matches = url.match(/([a-zA-Z0-9]{32})/);
    return matches ? matches[1] : null;
  }

  // 페이지 내용 가져오기
  async getPageContent(pageId) {
    try {
      const page = await this.client.pages.retrieve({ page_id: pageId });
      const blocks = await this.client.blocks.children.list({
        block_id: pageId,
      });

      // PR 링크 추출
      const prLinks = [];
      for (const block of blocks.results) {
        if (block.type === "paragraph") {
          const text = block.paragraph.rich_text
            .map((t) => t.plain_text)
            .join("");
          const githubPrRegex =
            /https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/g;
          const matches = text.match(githubPrRegex);
          if (matches) {
            prLinks.push(...matches);
          }
        }
      }

      return prLinks;
    } catch (error) {
      console.error("Notion 페이지 가져오기 실패:", error);
      throw error;
    }
  }
}

module.exports = NotionService;
