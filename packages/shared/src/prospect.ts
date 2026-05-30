import type { ProspectAssetType } from "./constants/index";

/** Prospect header fields used to build the consolidated context block. */
export interface ProspectContextFields {
  name: string;
  jobTitle?: string | null;
  companyName?: string | null;
  notes?: string | null;
}

/** Structured facts extracted from one asset. Mirrors the worker's schema. */
export interface StructuredData {
  role?: string | null;
  company?: string | null;
  interests?: string[] | null;
  recentActivity?: string | null;
  talkingPoints?: string[] | null;
}

/** One extracted insight contributing to the consolidated context. */
export interface ProspectInsightInput {
  assetType: ProspectAssetType;
  summary: string;
  structuredData?: StructuredData | null;
}

/** Human-readable section heading per asset type. */
const ASSET_TYPE_LABEL: Record<ProspectAssetType, string> = {
  linkedin_screenshot: "LinkedIn",
  github: "GitHub",
  personal_site: "Personal site",
  company_site: "Company",
  other_url: "Web source",
  notes: "Notes",
};

/**
 * Collect every recentActivity value across insights and deduplicate.
 * Recent activity is the single highest-value personalisation hook, so it is
 * pulled out to its own top-level section. Returns null when none found.
 */
function collectRecentActivity(insights: ProspectInsightInput[]): string | null {
  const activities = insights
    .map((i) => i.structuredData?.recentActivity)
    .filter((a): a is string => Boolean(a?.trim()));
  if (!activities.length) return null;
  return [...new Set(activities)].join("\n- ");
}

/**
 * Collect every talkingPoint across insights, deduplicate, and cap at 5.
 * Returns null when none found.
 */
function collectTalkingPoints(insights: ProspectInsightInput[]): string[] | null {
  const points = insights
    .flatMap((i) => i.structuredData?.talkingPoints ?? [])
    .filter((p): p is string => Boolean(p?.trim()));
  if (!points.length) return null;
  return [...new Set(points)].slice(0, 5);
}

/**
 * Render the per-source structured fields. Role/company live in the header and
 * recentActivity/talkingPoints are elevated to their own sections, so only
 * interests render here.
 */
function renderStructured(data: StructuredData): string {
  if (data.interests?.length) return `Interests: ${data.interests.join(", ")}`;
  return "";
}

/**
 * Build the consolidated `prospect_context.mergedContext` block from the
 * prospect's header fields and all extracted insights. Rebuilt by the
 * `consolidate-insights` worker after every asset completes, so it lives here
 * to stay identical to any future producer.
 *
 * Section order is intentional and message-generation prompts depend on it:
 * header → Recent Activity → Talking Points → per-source background.
 */
export function compileProspectContext(
  prospect: ProspectContextFields,
  insights: ProspectInsightInput[],
): string {
  const sections: string[] = [];

  // 1. Header — who this person is at a glance.
  const headerLines: string[] = [`# ${prospect.name}`];
  if (prospect.jobTitle) headerLines.push(`Role: ${prospect.jobTitle}`);
  if (prospect.companyName) headerLines.push(`Company: ${prospect.companyName}`);
  if (prospect.notes) headerLines.push(`Context: ${prospect.notes}`);
  sections.push(headerLines.join("\n"));

  // 2. Recent Activity — highest personalisation value, elevated to top-level.
  const recentActivity = collectRecentActivity(insights);
  if (recentActivity) sections.push(`## Recent Activity\n- ${recentActivity}`);

  // 3. Talking Points — ready-made hooks the generation prompt opens from.
  const talkingPoints = collectTalkingPoints(insights);
  if (talkingPoints?.length) {
    const numbered = talkingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n");
    sections.push(`## Talking Points\n${numbered}`);
  }

  // 4. Per-source background sections.
  for (const insight of insights) {
    if (!insight.summary && !insight.structuredData) continue;
    const label = ASSET_TYPE_LABEL[insight.assetType] ?? "Source";
    const parts: string[] = [];
    if (insight.summary?.trim()) parts.push(insight.summary.trim());
    if (insight.structuredData) {
      const structured = renderStructured(insight.structuredData);
      if (structured) parts.push(structured);
    }
    if (parts.length) sections.push(`## ${label}\n${parts.join("\n\n")}`);
  }

  return sections.filter(Boolean).join("\n\n");
}
