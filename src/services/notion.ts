import { Client } from "@notionhq/client";
import {
  BlockObjectResponse,
  PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

type ParagraphBlock = BlockObjectResponse & {
  type: "paragraph";
  paragraph: {
    rich_text: Array<{
      plain_text: string;
    }>;
  };
};

export class NotionService {
  private client: Client;

  constructor(apiKey: string) {
    this.client = new Client({ auth: apiKey });
  }

  extractPageId(url: string): string | null {
    const matches = url.match(/([a-zA-Z0-9]{32})/);
    return matches ? matches[1] : null;
  }

  async getPageContent(pageId: string): Promise<string[]> {
    try {
      const page = await this.client.pages.retrieve({ page_id: pageId });
      const blocks = await this.client.blocks.children.list({
        block_id: pageId,
      });

      const prLinks: string[] = [];
      for (const block of blocks.results) {
        if (this.isParagraphBlock(block)) {
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

  private isParagraphBlock(
    block: PartialBlockObjectResponse | BlockObjectResponse
  ): block is ParagraphBlock {
    return (
      "type" in block && block.type === "paragraph" && "paragraph" in block
    );
  }
}
