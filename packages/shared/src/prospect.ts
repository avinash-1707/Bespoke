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

/** Caps that keep the merged block tight when a prospect has many assets. */
const RECENT_ACTIVITY_CAP = 3;
const TALKING_POINTS_CAP = 5;

/**
 * Normalise a value into a dedup key: lowercased, whitespace-collapsed, with
 * trailing punctuation stripped. Catches near-duplicates that a raw `Set` of
 * the original strings would miss (e.g. "Posted about outreach" vs "Posted
 * about outreach.").
 */
function normaliseKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/g, "");
}

/**
 * Deduplicate display strings by their normalised key, preserving the first
 * occurrence's original casing/wording and input order. Blank values dropped.
 */
function dedupe(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = normaliseKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/**
 * Collect recentActivity across insights, dedup near-duplicates, cap at
 * {@link RECENT_ACTIVITY_CAP}. Recent activity is the highest-value
 * personalisation hook, so it is elevated to its own top-level section.
 */
function collectRecentActivity(
  insights: ProspectInsightInput[],
): string[] | null {
  const activities = dedupe(
    insights.map((i) => i.structuredData?.recentActivity),
  ).slice(0, RECENT_ACTIVITY_CAP);
  return activities.length ? activities : null;
}

/**
 * Collect talkingPoints across insights, dedup near-duplicates, cap at
 * {@link TALKING_POINTS_CAP}. Returns null when none found.
 */
function collectTalkingPoints(
  insights: ProspectInsightInput[],
): string[] | null {
  const points = dedupe(
    insights.flatMap((i) => i.structuredData?.talkingPoints ?? []),
  ).slice(0, TALKING_POINTS_CAP);
  return points.length ? points : null;
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
  if (prospect.companyName)
    headerLines.push(`Company: ${prospect.companyName}`);
  if (prospect.notes) headerLines.push(`Context: ${prospect.notes}`);
  sections.push(headerLines.join("\n"));

  // 2. Recent Activity — highest personalisation value, elevated to top-level.
  const recentActivity = collectRecentActivity(insights);
  if (recentActivity?.length) {
    const lines = recentActivity.map((a) => `- ${a}`).join("\n");
    sections.push(`## Recent Activity\n${lines}`);
  }

  // 3. Talking Points — ready-made hooks the generation prompt opens from.
  const talkingPoints = collectTalkingPoints(insights);
  if (talkingPoints?.length) {
    const numbered = talkingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n");
    sections.push(`## Talking Points\n${numbered}`);
  }

  // 4. Per-source background — one section per asset type (multiple assets of
  // the same type collapse into one), summaries deduped within and across
  // sections so overlapping bios across LinkedIn/GitHub/site do not repeat.
  const byType = new Map<ProspectAssetType, ProspectInsightInput[]>();
  for (const insight of insights) {
    const group = byType.get(insight.assetType) ?? [];
    group.push(insight);
    byType.set(insight.assetType, group);
  }

  const seenSummary = new Set<string>();
  for (const [assetType, group] of byType) {
    const label = ASSET_TYPE_LABEL[assetType] ?? "Source";
    const summaries = dedupe(group.map((g) => g.summary)).filter((s) => {
      const key = normaliseKey(s);
      if (seenSummary.has(key)) return false;
      seenSummary.add(key);
      return true;
    });
    const interests = dedupe(
      group.flatMap((g) => g.structuredData?.interests ?? []),
    );

    const parts: string[] = [];
    if (summaries.length) parts.push(summaries.join("\n\n"));
    if (interests.length) parts.push(`Interests: ${interests.join(", ")}`);
    if (parts.length) sections.push(`## ${label}\n${parts.join("\n\n")}`);
  }

  return sections.filter(Boolean).join("\n\n");
}
