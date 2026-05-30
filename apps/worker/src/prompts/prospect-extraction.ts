/**
 * Prospect extraction prompts — scrape-prospect-asset worker.
 *
 * Per-asset-type prompts: GitHub, personal site, company site, and LinkedIn
 * screenshot each carry different signal, so each gets a focused prompt. The
 * insight schema is prescriptive about what a *good* talking point / recent
 * activity looks like — generic facts are explicitly rejected in favour of null.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const insightSchema = z.object({
  summary: z
    .string()
    .describe(
      "2-3 sentences. Who this person is, what they do, and one specific " +
        "detail that makes them memorable. Written as a briefing note for a " +
        "salesperson who has never heard of them.",
    ),
  structuredData: z
    .object({
      role: z.string().nullable().describe("Current job title, or null"),
      company: z
        .string()
        .nullable()
        .describe("Current employer or company they run, or null"),
      interests: z
        .array(z.string())
        .nullable()
        .describe(
          "Professional interests or areas they write/post/build about. " +
            "Only include if clearly evidenced, not inferred.",
        ),
      recentActivity: z
        .string()
        .nullable()
        .describe(
          "The single most recent and specific thing they did, wrote, posted, " +
            "or shipped. A concrete event, not a general description of their work. " +
            "Examples: 'Posted about struggling with outreach volume last week', " +
            "'Merged a PR adding WebSocket support to their open-source library', " +
            "'Published an article on pricing strategy for B2B SaaS'. Null if nothing specific found.",
        ),
      talkingPoints: z
        .array(z.string())
        .nullable()
        .describe(
          "2-4 highly specific hooks a salesperson could open a cold message with. " +
            "Each must be concrete and personal — something only true of this person. " +
            "BAD: 'Technical background', 'Works in B2B SaaS', 'Interested in automation'. " +
            "GOOD: 'Recently posted about being overwhelmed by manual outreach volume', " +
            "'Built and open-sourced a Rust CLI tool for log parsing', " +
            "'Their company just moved upmarket to enterprise and their website reflects it'. " +
            "If you cannot produce specific hooks, return null rather than generic ones.",
        ),
    })
    .describe("Structured facts. Use null for anything not clearly evidenced."),
});

export type Insight = z.infer<typeof insightSchema>;

// ---------------------------------------------------------------------------
// Shared base instruction (injected into every prompt)
// ---------------------------------------------------------------------------

const BASE_RULES = `
Rules:
- Be specific. Generic facts (e.g. "works in tech", "interested in AI") are useless. If you can't be specific, use null.
- Do not invent or infer. Only extract what is clearly stated or directly evidenced.
- Recent activity is the most valuable field. Prioritise finding something concrete and recent over filling every field.
- talkingPoints should read like a salesperson's cheat sheet — each one a ready-made conversation opener.
- If the source is thin or irrelevant, return a minimal but accurate extraction rather than padding it out.
`.trim();

// ---------------------------------------------------------------------------
// Per-asset-type prompt builders
// ---------------------------------------------------------------------------

/**
 * GitHub profile / repo page.
 * Signal to chase: what they're actively building, their most notable project,
 * recent commits or releases, languages they use, anything in their bio/readme.
 */
export function buildGitHubPrompt(markdown: string): string {
  return `
You are extracting a sales-relevant profile from a GitHub page.

Focus on:
- What projects they are actively building or maintaining (recent commits, releases)
- The most notable or starred thing they have shipped
- Technologies and languages they use day-to-day
- Anything personal in their bio, pinned repos, or profile README
- Signs of the problems they are trying to solve through their work

${BASE_RULES}

---
GitHub page content:
${markdown.slice(0, 12_000)}
`.trim();
}

/**
 * Personal site or portfolio.
 * Signal to chase: how they describe themselves, what work they highlight,
 * what they are currently focused on, any writing or projects they surface.
 */
export function buildPersonalSitePrompt(markdown: string): string {
  return `
You are extracting a sales-relevant profile from a personal website or portfolio.

Focus on:
- How they describe their own work and expertise in their own words
- What projects, clients, or case studies they choose to highlight
- What they say they are currently working on or interested in
- Any blog posts or writing that reveals current thinking or pain points
- The problem-space they operate in

${BASE_RULES}

---
Personal site content:
${markdown.slice(0, 12_000)}
`.trim();
}

/**
 * Company website.
 * Signal to chase: what the company sells, who they sell to, company stage
 * and positioning, recent news or hires, anything that reveals context around
 * the prospect's world (their customers' problems, their GTM motion, etc.).
 */
export function buildCompanySitePrompt(markdown: string): string {
  return `
You are extracting context about a prospect's company from their company website.
The goal is to understand the world the prospect operates in, not to describe the company generically.

Focus on:
- What the company sells and who it sells to (ICP, market)
- Company stage signals: early-stage scrappy, growth-stage scaling, enterprise, etc.
- Recent news, product launches, hires, or positioning shifts
- The problems the company is trying to solve for their customers
- Anything that reveals pressure or opportunity the prospect is likely dealing with

${BASE_RULES}

---
Company site content:
${markdown.slice(0, 12_000)}
`.trim();
}

/**
 * LinkedIn screenshot (vision input).
 * Signal to chase: current role, tenure, recent posts or activity visible in
 * the screenshot, career trajectory, anything they have written.
 */
export function buildLinkedInPrompt(): string {
  return `
You are extracting a sales-relevant profile from a LinkedIn profile screenshot.

Focus on:
- Current role and company, and how long they have been there
- Any posts, comments, or activity visible in the screenshot — these are gold
- Career trajectory: are they a technical person who moved into sales? An IC who became a manager?
- Skills, endorsements, or recommendations that reveal what they are known for
- Education or background details that could be a personal connection point
- Any content they have written that reveals current thinking or frustrations

${BASE_RULES}

The input is a screenshot. Extract only what is clearly visible.
`.trim();
}

/**
 * Generic fallback for other_url assets.
 */
export function buildGenericUrlPrompt(markdown: string): string {
  return `
You are extracting a sales-relevant profile of a prospect from a web page.

Focus on:
- Who this person is and what they are currently working on
- Any recent activity, writing, or output
- Specific details that could make a cold outreach message feel personal and relevant

${BASE_RULES}

---
Page content:
${markdown.slice(0, 12_000)}
`.trim();
}

/** Pick the right prompt builder based on asset type (URL/text assets only). */
export function buildPromptForAssetType(
  assetType: string,
  markdown: string,
): string {
  switch (assetType) {
    case "github":
      return buildGitHubPrompt(markdown);
    case "personal_site":
      return buildPersonalSitePrompt(markdown);
    case "company_site":
      return buildCompanySitePrompt(markdown);
    default:
      return buildGenericUrlPrompt(markdown);
  }
}
