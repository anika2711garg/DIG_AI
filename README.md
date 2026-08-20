# Issue-to-PR Agent

An MCP-native agent that reads a GitHub bug report, **writes a failing test to prove the bug
exists**, patches the code, verifies the fix in a **network-off sandbox**, and opens a **draft
PR — only after a human approves**.

The signature idea: editing code is easy for an LLM; *proving the edit fixed the reported bug*
is the engineering problem. A failing-test-turned-passing is objective proof.

```
ISSUE → LOCALIZE → REPRODUCE → PATCH → VERIFY → APPROVE → PR
```

The product ships as one Next.js app: a **dashboard** for operators and a **framework-free
engine** that does the work. The UI never auto-approves a patch.

## The five rules we never break

1. **Persist before side effect** — write the state change to Postgres, then do the work.
2. **The model proposes, code disposes** — the LLM writes tests/patches; deterministic code
   moves states, runs sandboxes, parses results, applies edits, calls GitHub.
3. **No secrets in the sandbox** — the GitHub token and LLM key never enter a container.
4. **Every external write is idempotent** — an idempotency-key row goes in before the API call.
5. **Failures are typed, never free text** — every dead run lands in one taxonomy category.

## Layout (single Next.js app)

```
src/app/            # Next.js App Router — the ONLY routing surface (UI + API)
  page.tsx          #   landing
  runs/             #   run list, run detail, traces, human approval
  eval/             #   evaluation dashboard (from persisted runs)
  settings/         #   theme + UI preferences
  api/[[...path]]   #   Hono engine API mounted at /api/*
src/components/     # React UI (landing, chrome, runs, traces, approval, eval)
src/lib/            # frontend helpers only (theme, prefs, fetch, status)
libs/               # the agent + shared code (framework-free; never imports React/Next)
  core/             #   state machine · failure taxonomy · confidence · budget · schemas
  db/               #   Drizzle schema + client + migrations
  orchestrator/     #   state-machine driver + job loop
  services/         #   ingest · localize · reproduce · patch · verify · approvals · PRs
  integrations/     #   github · llm · e2b sandbox
  mcp/ security/ api/
util/               # small helpers (junit parser, config loader)
scripts/            # long-running agent worker (plain node/tsx, not a route)
tests/              # cross-cutting engine tests
```

One package, one `node_modules`. Import aliases: `@libs/*`, `@util/*`, `@/*` (→ `src`).
An ESLint rule keeps `libs/` + `util/` framework-free so the engine stays portable.
TypeScript strict. Vitest. Node 22 LTS. The heavy agent loop runs as a
**worker** (`npm run worker` / `pnpm worker`), because a Next route would time out.

## Frontend

The dashboard is a thin operator surface over the event log. It does not invent
engine state and it does not skip the human gate.

### Screens

| Route | What it is |
| --- | --- |
| `/` | Landing — pipeline story, modes, and a live console preview |
| `/runs` | Start a run (`owner/repo` + issue number or GitHub URL) and filter the table |
| `/runs/:id` | Live pipeline, evidence, budget, event stream (SSE + 4s poll) |
| `/runs/:id/trace` | Model/tool traces with search, kind filter, and copy-JSON |
| `/runs/:id/approval` | Review the diff and **approve or reject**. Nothing ships without this. |
| `/eval` | Resolve rate and stage metrics from real persisted runs |
| `/settings` | Light / dark / system theme, default mode, compact traces, timestamps |

`Ctrl/Cmd+K` opens the command palette (jump to runs, eval, settings, a run id, or toggle theme).

### Stack

- Next.js 16 App Router, React 19, Tailwind 4, Framer Motion, lucide-react
- Light and dark themes via `html.light` / `html.dark` CSS tokens (`localStorage` key `neone-theme`)
- UI prefs in `localStorage` (`neone-prefs`) — default mode, compact traces, timestamps
- Server pages load through `src/lib/server-api.ts`; the browser uses `src/lib/api.ts`
- The Hono server in `libs/api` is mounted at `src/app/api/[[...path]]/route.ts`

### Modes and confidence

Runs use **strict**, **permissive**, or **vibes** (ablation only). Confidence is graded
**strong** / **weak** / **unreproduced**. Failures use the typed taxonomy — the UI
renders badges, it does not invent reasons.

## Dev setup

Copy `.env.example` to `.env` and fill Neon, E2B, OpenRouter, and GitHub values.

```bash
npm install          # or: pnpm install
npm test             # Vitest across libs/ util/ tests/
npm run typecheck    # tsc --noEmit
npm run lint
npm run dev          # dashboard + API on http://localhost:3000
npm run worker       # agent loop (needed for runs to progress)
```

Two processes in development: **Next** serves the UI and `/api`, **worker** advances
runs. Sandbox execution runs on **E2B** (cloud, network-off) and the database on
**Neon** (Postgres) — no local Docker required.

Useful extras: `npm run db:migrate`, `npm run db:reset`, `npm run eval`, `npm run mcp`.
