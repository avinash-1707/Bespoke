# Bespoke

**AI-powered personalized outreach dashboard.** Define your offering once,
shape how messages should sound, drop in whatever you have on a prospect —
URLs and screenshots — and get back outreach that reads like a human wrote it
specifically for that person. When the prospect replies, paste it in and get a
contextual follow-up that continues the conversation naturally.

> **Live demo:** _<add deployed URL>_
> **Walkthrough video:** _<add video link>_

---

## Table of Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Running locally](#running-locally)
- [Environment variables](#environment-variables)
- [How generation works](#how-generation-works)
- [Example outputs](#example-outputs)
- [Architecture decisions](#architecture-decisions)
- [Tradeoffs](#tradeoffs)
- [What I'd do with more time](#what-id-do-with-more-time)

---

## What it does

1. **Authentication** — email/password sign-up and sign-in. Every user's
   offerings, prompts, prospects, and message history are fully isolated.
2. **Offering setup** — build an offering by scraping a URL, typing it
   manually, or both (scrape, then edit on top). Raw scraped content is kept
   separate from your edits so neither is lost. Multiple offerings per user.
   Inline AI explains what a good offering looks like.
3. **Prompt customization** — write and save reusable system prompts that
   drive generation: tone, length, angle, what to emphasize, what to avoid,
   how to open and close. One can be marked default. Inline AI explains how to
   write an effective prompt.
4. **Prospect management** — save a prospect once, reuse across offerings. Add
   any combination of a LinkedIn screenshot, GitHub URL, personal site,
   company site, any other URL, or free-text notes. Each input is scraped or
   vision-read in the background; per-input insights are merged into a single
   consolidated context.
5. **Message generation** — combine offering + prompt + prospect context into a
   personalized message. Every generation is saved; rate (1–5), favourite, copy
   in one click, delete, or regenerate with a different tone — no re-entry.
6. **Reply handling** — paste a prospect's reply into the conversation thread
   and get a contextual follow-up using the full thread, original prospect
   context, and original offering. The whole thread stays visible.
7. **Analytics** — total messages generated, offering usage breakdown,
   prospects saved, conversations with replies, top-rated messages, and
   generation volume over time.

---

## Tech stack

Versions pinned to latest stable as of May 2026.

| Layer        | Technology                                              | Version             |
| ------------ | ------------------------------------------------------- | ------------------- |
| Runtime      | Node.js                                                 | `24` (LTS)          |
| Language     | TypeScript (strict)                                     | `6.0.x`             |
| Pkg manager  | pnpm workspaces                                         | `11.x`              |
| Monorepo     | Turborepo                                               | `2.9.x`             |
| Frontend     | Next.js (App Router) / React                            | `16.2.x` / `19.2.x` |
| Styling      | Tailwind CSS                                            | `4.3.x`             |
| Components   | shadcn/ui (CLI v4, unified `radix-ui`)                  | CLI `4.x`           |
| Icons        | lucide-react                                            | `1.17.x`            |
| Client data  | TanStack Query                                          | `5.100.x`           |
| Validation   | Zod                                                     | `4.4.x`             |
| Backend      | Fastify                                                 | `5.8.x`             |
| Database     | PostgreSQL                                              | `18.x`              |
| ORM          | Drizzle ORM + drizzle-kit                               | `0.45.x`            |
| Queue        | BullMQ + ioredis                                        | `5.77.x` / `5.x`    |
| Cache/broker | Upstash Redis (TCP/ioredis)                             | server `8.x`        |
| Auth         | Better Auth                                             | `1.6.x`             |
| AI           | OpenRouter via Vercel AI SDK (`ai` + provider)          | `6.x` / `2.9.x`     |
| Scraping     | Firecrawl (`@mendable/firecrawl-js`)                    | `4.22.x`            |

---

## Architecture

Three deployable apps and three shared packages in a pnpm + Turborepo monorepo.

```
┌──────────┐      HTTP       ┌──────────┐    enqueue    ┌──────────┐
│   web    │ ──────────────▶ │   api    │ ────────────▶ │  Upstash │
│ Next.js  │ ◀────────────── │ Fastify  │               │  Redis   │
└──────────┘   JSON {data}   └────┬─────┘               └────┬─────┘
                                  │                          │ consume
                            Drizzle queries                  ▼
                                  │                     ┌──────────┐
                                  ▼                     │  worker  │
                            ┌──────────┐                │ BullMQ   │
                            │ Postgres │ ◀───── writes ─┤ Firecrawl│
                            └──────────┘                │ + AI SDK │
                                                        └──────────┘
```

- **`web`** — Next.js UI only. No direct DB access. Calls the Fastify API for
  all data. Server components fetch server-side; client mutations use TanStack
  Query.
- **`api`** — all business logic, validation, auth enforcement, Drizzle
  queries, and job enqueueing. Never runs long-lived scraping or AI work
  inline — always delegates to the queue and returns a job ID for polling.
- **`worker`** — job execution only. Reads BullMQ queues, runs scraping and AI
  extraction/generation, writes results back to Postgres. No HTTP surface;
  stateless, safe to scale horizontally.

### Core invariants

- Request handlers never run long-lived work inline — scraping and AI are
  always queued.
- Auth is enforced before any data access; every user-owned query includes a
  `user_id` filter. The API never trusts a `user_id` from the request body.
- `packages/db` schema is the single source of truth — no inline SQL.
- Job payload types are defined once in `packages/queue` and shared by producer
  (api) and consumer (worker).
- `prospect_context` is always derived by the `consolidate-insights` job, never
  hand-edited. `offerings.compiled_context` is rebuilt on every save.

### Queues

```
scrape-queue
├── scrape-prospect-asset    # scrape a URL or vision-read a screenshot
├── scrape-offering-source   # scrape an offering source URL
└── consolidate-insights     # merge all prospect insights → prospect_context

generate-queue
├── generate-message         # initial outreach generation
└── generate-reply           # conversation reply generation
```

**Prospect scrape flow:** API creates a `prospect_asset` (status `pending`) and
enqueues `scrape-prospect-asset` → worker scrapes/vision-reads, writes a
`prospect_insights` row, marks the asset `done` → when all assets for the
prospect are done, enqueues `consolidate-insights` → that merges every insight
into `prospect_context`, ready for generation.

---

## Project structure

```
bespoke/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   └── src/
│   │       ├── app/         # App Router pages and layouts
│   │       ├── components/  # UI by domain (ui/ offerings/ prospects/ …)
│   │       └── lib/         # api-client, auth-client, TanStack hooks
│   ├── api/                 # Fastify REST API
│   │   └── src/
│   │       ├── plugins/     # auth, cors, db
│   │       ├── routes/      # one folder per domain (handlers + Zod schema)
│   │       ├── services/    # business logic, one file per domain
│   │       └── config.ts    # Zod-validated env
│   └── worker/              # BullMQ standalone worker
│       └── src/processors/  # one file per job type
└── packages/
    ├── db/                  # Drizzle schema, migrations, client factory
    ├── shared/              # shared types, enums, constants
    └── queue/              # queue defs, producers, job payload types
```

---

## Running locally

### Prerequisites

- Node.js `>=24` and pnpm `>=11`
- A PostgreSQL `18.x` database (local or hosted)
- An Upstash Redis database (use the **TCP** `rediss://` connection string)
- API keys: OpenRouter, Firecrawl

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
#   then fill in the values (see the next section)

# 3. Apply database migrations
pnpm --filter @bespoke/db migrate

# 4. Start everything (web + api + worker) via Turborepo
pnpm dev
```

By default:

- web → `http://localhost:3000`
- api → `http://localhost:3001`

Run a single app with, e.g., `pnpm --filter @bespoke/web dev`.

---

## Environment variables

All variables are declared in `.env.example`. Each app reads its own via a
Zod-validated `config.ts` — `process.env` is never accessed directly elsewhere.
`NEXT_PUBLIC_` is used only for values the browser needs.

| Variable                | Used by          | Description                                    |
| ----------------------- | ---------------- | ---------------------------------------------- |
| `DATABASE_URL`          | api, worker, db  | PostgreSQL connection string                   |
| `REDIS_URL`             | api, worker      | Upstash Redis **TCP** URL (`rediss://…`)       |
| `BETTER_AUTH_SECRET`    | api              | Session signing secret                         |
| `BETTER_AUTH_URL`       | api              | Auth base URL                                  |
| `OPENROUTER_API_KEY`    | worker           | OpenRouter key (the only AI key needed)        |
| `OPENROUTER_MODEL`      | worker           | Default generation model slug                  |
| `FIRECRAWL_API_KEY`     | worker           | Firecrawl scraping key                         |
| `NEXT_PUBLIC_API_URL`   | web              | Fastify API origin                             |

> The Vercel AI SDK is a library — it needs no key of its own. Only
> `OPENROUTER_API_KEY` is required for all LLM calls.

> Upstash must use the **TCP** endpoint with `ioredis`
> (`maxRetriesPerRequest: null`). The serverless REST SDK (`@upstash/redis`)
> is **not** compatible with BullMQ.

---

## How generation works

A message is generated from three inputs, combined deterministically:

- **System prompt** — the user's customized prompt, sent as the LLM system
  message. Controls tone, length, structure, and constraints.
- **Offering** — the selected offering's `compiled_context`, giving the model
  the value proposition to anchor on.
- **Prospect context** — the consolidated `prospect_context` merged from every
  scraped URL and vision-read screenshot.

Because the prompt and offering are distinct inputs, changing either one
meaningfully changes the output — not just cosmetically. Replies reuse the full
conversation thread plus the original prospect context and offering, so a
follow-up continues the conversation rather than starting fresh.

---

## Example outputs

> _Filled in after build with real runs — actual inputs and the messages they
> produced._

**Example 1 — initial outreach**

- **Offering:** _<name>_
- **Prompt:** _<summary: tone, length, constraints>_
- **Prospect inputs:** _<e.g. GitHub URL + portfolio + LinkedIn screenshot>_
- **Generated message:**
  ```
  <paste real output>
  ```

**Example 2 — reply handling**

- **Prospect reply:** _<paste>_
- **Generated follow-up:**
  ```
  <paste real output>
  ```

**Example 3 — same prospect, different prompt** (shows customization changing
output)

- **Prompt A output:** `<paste>`
- **Prompt B output:** `<paste>`

---

## Architecture decisions

- **Monorepo (pnpm + Turborepo)** — share Drizzle row types and BullMQ payload
  types across web/api/worker without duplication or drift.
- **Separate worker process** — scraping and AI calls are slow (5–30s) and must
  not block API response time; the worker scales independently of the API.
- **BullMQ + Redis over a DB-based queue** — superior retry, rate limiting, and
  concurrency control; job status is mirrored into Postgres so failures are
  visible without inspecting Redis.
- **Upstash Redis over TCP** — managed, serverless-friendly Redis that still
  exposes a TCP endpoint BullMQ can use.
- **Derived `prospect_context`** — rebuilt by a job rather than merged on every
  generation, so generation reads one clean context row.
- **Offering source tracking** — raw scraped content is stored separately from
  the user-edited offering, so scraping and manual editing compose freely.
- **OpenRouter via the Vercel AI SDK** — one typed interface, easy model
  switching, and built-in vision support for screenshot extraction, behind a
  single API key.

---

## Tradeoffs

- **Three services + Redis is more infrastructure** than a single Next.js app.
  Chosen for clean boundaries and independent scaling of slow background work,
  at the cost of more deploy surface and more env wiring.
- **Polling for job status** (rather than websockets/SSE) keeps the API and
  client simple; the UI shows per-asset scrape status while jobs run.
- **Upstash per-command billing** — BullMQ polls continuously, so command count
  accrues even when idle. Acceptable at this scale; worker concurrency and poll
  intervals are left at defaults to keep it bounded.
- **Local disk for uploads in dev** — screenshots are stored on disk locally
  and on S3-compatible storage in production, keyed by `prospect_assets.file_key`.

---

## What I'd do with more time

- Real-time job status via SSE/websockets instead of polling.
- Streaming generation output token-by-token in the UI.
- A/B comparison view for prompts and offerings on the same prospect.
- Richer analytics (reply rate by offering, rating trends over time).
- Background re-scrape and context refresh when a prospect's sources change.
- Per-user configurable generation model and temperature.
- End-to-end tests covering the full scrape → consolidate → generate flow.

---

_Built for the Personalized Outreach Dashboard assignment. Every decision above
is documented in `context/` and can be explained in detail._
