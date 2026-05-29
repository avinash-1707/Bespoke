import type { ProspectAssetType } from "./constants/index";

/** Prospect header fields used to build the consolidated context block. */
export interface ProspectContextFields {
  name: string;
  jobTitle?: string | null;
  companyName?: string | null;
  notes?: string | null;
}

/** One extracted insight contributing to the consolidated context. */
export interface ProspectInsightInput {
  assetType: ProspectAssetType;
  summary: string;
  structuredData?: Record<string, unknown> | null;
}

/** Human-readable section heading per asset type. */
const ASSET_TYPE_LABEL: Record<ProspectAssetType, string> = {
  linkedin_screenshot: "LinkedIn profile",
  github: "GitHub",
  personal_site: "Personal site",
  company_site: "Company site",
  other_url: "Web source",
  notes: "Notes",
};

/** Flatten a structuredData object into `- key: value` bullet lines. */
function renderStructured(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => {
      const text =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return `- ${key}: ${text}`;
    })
    .join("\n");
}

/**
 * Build the consolidated `prospect_context.mergedContext` block from the
 * prospect's header fields and all extracted insights. Rebuilt by the
 * `consolidate-insights` worker after every asset completes, so it lives here
 * to stay identical to any future producer. Empty sections are omitted.
 */
export function compileProspectContext(
  prospect: ProspectContextFields,
  insights: ProspectInsightInput[],
): string {
  const header: Array<[string, string | null | undefined]> = [
    ["", `# ${prospect.name}`],
    ["Role", prospect.jobTitle],
    ["Company", prospect.companyName],
    ["Notes", prospect.notes],
  ];

  const headerBlock = header
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([heading, body]) => (heading ? `## ${heading}\n${body}` : body))
    .join("\n\n");

  const insightBlocks = insights
    .filter((insight) => insight.summary || insight.structuredData)
    .map((insight) => {
      const label = ASSET_TYPE_LABEL[insight.assetType] ?? "Source";
      const parts = [insight.summary?.trim()].filter(Boolean) as string[];
      if (insight.structuredData) {
        const structured = renderStructured(insight.structuredData);
        if (structured) parts.push(structured);
      }
      return parts.length ? `## ${label}\n${parts.join("\n\n")}` : "";
    })
    .filter(Boolean);

  return [headerBlock, ...insightBlocks].filter(Boolean).join("\n\n");
}
