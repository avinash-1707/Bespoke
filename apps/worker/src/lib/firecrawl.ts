import Firecrawl from "@mendable/firecrawl-js";
import { config } from "../config";

/** Firecrawl client for scraping offering and prospect source URLs. */
export const firecrawl = new Firecrawl({ apiKey: config.FIRECRAWL_API_KEY });

/** Scrape a URL to markdown. Throws when no content is returned. */
export async function scrapeMarkdown(url: string): Promise<string> {
  const doc = await firecrawl.scrape(url, { formats: ["markdown"] });
  const markdown = doc.markdown?.trim();
  if (!markdown) {
    throw new Error(`Firecrawl returned no content for ${url}`);
  }
  return markdown;
}
