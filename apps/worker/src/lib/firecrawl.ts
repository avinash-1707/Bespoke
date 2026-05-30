import Firecrawl from "@mendable/firecrawl-js";
import { config } from "../config";
import { parseGithubUrl, fetchGithubMarkdown } from "./github";
import { logger } from "./logger";

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

/**
 * Fetch a source URL to markdown. GitHub user/repo URLs go through the GitHub
 * REST API (richer than scraped HTML); everything else, and any GitHub API
 * failure, falls back to Firecrawl.
 */
export async function fetchSourceMarkdown(url: string): Promise<string> {
  if (parseGithubUrl(url)) {
    try {
      return await fetchGithubMarkdown(url);
    } catch (error) {
      logger.warn("github api failed, falling back to firecrawl", {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return scrapeMarkdown(url);
}
