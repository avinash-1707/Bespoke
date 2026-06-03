import { config } from "../config";

/**
 * GitHub source fetcher. Pulls structured profile/repo data from the GitHub
 * REST API and renders it as markdown for the LLM extraction step — far richer
 * than scraping the rendered HTML page. `parseGithubUrl` gates which URLs take
 * this path; everything else stays on Firecrawl.
 */

const API_BASE = "https://api.github.com";

/** First path segments on github.com that are site features, not users. */
const RESERVED_SEGMENTS = new Set([
  "features",
  "about",
  "pricing",
  "sponsors",
  "marketplace",
  "topics",
  "trending",
  "collections",
  "explore",
  "settings",
  "notifications",
  "orgs",
  "apps",
  "login",
  "logout",
  "join",
  "search",
  "contact",
]);

export type GithubTarget =
  | { kind: "profile"; owner: string }
  | { kind: "repo"; owner: string; repo: string };

/**
 * Parse a github.com URL into a profile or repo target, or `null` when the URL
 * is not a GitHub user/repo page (other host, gist, raw, or a reserved feature
 * path). Tolerates `/tree/...`, `/blob/...`, `.git`, query and hash suffixes.
 */
export function parseGithubUrl(url: string): GithubTarget | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "github.com") return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const owner = segments[0];
  if (!owner || RESERVED_SEGMENTS.has(owner.toLowerCase())) return null;

  const repo = segments[1]?.replace(/\.git$/, "");
  if (!repo) return { kind: "profile", owner };
  return { kind: "repo", owner, repo };
}

/** Call the GitHub API, throwing a descriptive error on any non-2xx. */
async function ghFetch(path: string, accept?: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: accept ?? "application/vnd.github+json",
    "User-Agent": "bespoke-worker",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (config.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${config.GITHUB_TOKEN}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${path}`);
  }
  return res;
}

interface GithubUser {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  followers: number;
  public_repos: number;
}

interface GithubRepo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string | null;
  topics?: string[];
}

/** `value` line only when present, so empty fields don't pad the prompt. */
function line(label: string, value: string | null | undefined): string | null {
  const v = value?.toString().trim();
  return v ? `**${label}:** ${v}` : null;
}

function formatRepoListItem(repo: GithubRepo): string {
  const meta = [
    repo.language,
    `★${repo.stargazers_count}`,
    repo.pushed_at ? `pushed ${repo.pushed_at.slice(0, 10)}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const desc = repo.description?.trim();
  return `- **${repo.name}**${desc ? ` — ${desc}` : ""}${meta ? ` (${meta})` : ""}`;
}

async function fetchProfileMarkdown(owner: string): Promise<string> {
  const user = (await (await ghFetch(`/users/${owner}`)).json()) as GithubUser;
  const repos = (await (
    await ghFetch(`/users/${owner}/repos?sort=pushed&per_page=10&type=owner`)
  ).json()) as GithubRepo[];

  const parts = [
    `# GitHub profile: ${user.name ?? user.login} (@${user.login})`,
    line("Bio", user.bio),
    line("Company", user.company),
    line("Location", user.location),
    line("Website", user.blog),
    line("Followers", String(user.followers)),
    line("Public repos", String(user.public_repos)),
  ].filter(Boolean);

  if (repos.length > 0) {
    parts.push("", "## Recent repositories", ...repos.map(formatRepoListItem));
  }

  return parts.join("\n");
}

async function fetchRepoMarkdown(owner: string, repo: string): Promise<string> {
  const data = (await (
    await ghFetch(`/repos/${owner}/${repo}`)
  ).json()) as GithubRepo;

  const parts = [
    `# GitHub repository: ${data.full_name}`,
    line("Description", data.description),
    line("Language", data.language),
    line("Stars", String(data.stargazers_count)),
    line("Topics", data.topics?.length ? data.topics.join(", ") : null),
  ].filter(Boolean);

  // README is best-effort: a repo without one shouldn't fail the fetch.
  try {
    const readme = await (
      await ghFetch(
        `/repos/${owner}/${repo}/readme`,
        "application/vnd.github.raw",
      )
    ).text();
    const trimmed = readme.trim();
    if (trimmed) {
      parts.push("", "## README", trimmed.slice(0, 10_000));
    }
  } catch {
    // No README — omit it.
  }

  return parts.join("\n");
}

/**
 * Fetch a GitHub profile or repo URL as markdown via the REST API. Throws when
 * the URL is not a GitHub target or the API call fails, so the caller can fall
 * back to Firecrawl.
 */
export async function fetchGithubMarkdown(url: string): Promise<string> {
  const target = parseGithubUrl(url);
  if (!target) {
    throw new Error(`Not a GitHub user/repo URL: ${url}`);
  }
  return target.kind === "profile"
    ? fetchProfileMarkdown(target.owner)
    : fetchRepoMarkdown(target.owner, target.repo);
}
