# AI Engineering Hub — Project Rules for AI Assistants

A production-grade **AI Engineering Operations Platform**: a single Tauri desktop app (Hub) that ingests metrics from any AI dev tool, computes analytics + repository intelligence, and serves a local API/WebSocket consumed by both its own React UI and a companion Stream Deck plugin.

> Target feel: GitHub / Linear / Datadog / JetBrains density with Apple-grade restraint. **Not** a KPI-card marketing dashboard.

---

## Path Privacy

- Never expose real local file system paths. Use repository-relative paths.
- ❌ `C:\Users\name\...\src\main.rs`  ❌ `/home/name/project/...`  ❌ `~/Projects/app/...`
- ✅ `apps/ai-engineering-hub/src-tauri/src/main.rs`
- Never expose usernames, home dirs, drive letters, or temp paths in logs, stack traces, PRs, commits, or markdown.

---

## Architecture

Local-first desktop platform in a pnpm + Cargo + Turbo monorepo. **Tauri is the shell, and it hosts an Axum server.**

```
apps/ai-engineering-hub/
  core/                ← Rust core (Tauri-free): Axum HTTP/WS server, SQLx/SQLite, dynamic ingestion, analytics, intelligence
  src-tauri/           ← Tauri v2 shell (thin): owns the process, spawns the core server in setup()
  src/frontend/        ← React + TanStack renderer (Vite SPA)
apps/streamdeck-plugin/ ← Elgato Stream Deck plugin (separate app; consumes Hub API/WS only)
packages/
  shared-types/        ← domain + analytics types (TS + Rust mirrors)
  shared-events/       ← EventEnvelope + WS/ingest event contracts (TS + Rust mirrors)
  shared-api-contracts/ ← request/response shapes for every Hub endpoint (TS)
  shared-sdk/          ← typed client over api-contracts + events (used by the plugin / external tools)
  shared-design-tokens/ ← Apple-derived design tokens (colors/type/spacing/radius/elevation)
```

**Key invariants**

- **One Tauri process.** The Axum HTTP + WebSocket server runs inside Tauri (`tokio::spawn` in `setup()`), bound to a fixed localhost port. This single API is the data source for the desktop UI **and** the Stream Deck plugin.
- **Everything runs inside the single Tauri app.** No Node/Python/Go services, no sidecars, no helper executables, no external analytics services. (The Stream Deck plugin is the one separate app — it is launched by Elgato software, not by the Hub.)
- **Sources are data, not code.** Tools (Claude Code, RTK, Graphify, Aider, homegrown scripts, …) are rows in a `sources` registry, never a hardcoded enum. New tools are added via the registry + mapping rules, HTTP push, or auto-detection — **no recompile**.

---

## Stack & boundaries

- **Backend**: Rust · Tauri v2 · Tokio · Axum · SQLx · SQLite. Business logic lives in Rust; the frontend stays presentation-focused.
- **Frontend**: React · TypeScript · TanStack **Router / Query / Table / Virtual / Form / Store**.
  - **Do not use** `@tanstack/start` (deprecated → `@tanstack/react-start`, and it needs an SSR server that conflicts with the single-Tauri-app rule) or `@tanstack/config` (unsupported library-publishing tooling). Router covers file-based routing; build shared packages with tsup / Vite lib mode.
- **Plugin**: consumes the Hub API/WS via `shared-sdk` only. It must **never** parse logs, **never** access SQLite, **never** compute analytics.
- **Package boundaries**: `shared-types`/`shared-events` have no UI and no app logic. `shared-design-tokens` has no React. `shared-sdk` has no UI. Layout components live in the hub app, not in a shared package.

---

## Tooling

- **Prefer the Bash tool**; prefix commands with `rtk` (savings wrapper): `rtk pnpm build`, `rtk cargo build`, `rtk rg foo`, `rtk fd src`. Meta: `rtk gain` (savings), `rtk discover` (missed opportunities).
- Monorepo tasks via Turbo: `rtk pnpm build` / `dev` / `lint` (→ `turbo …`). Rust via the Cargo workspace: `rtk cargo build --workspace`.
- Use `rtk rg` not `grep`, `rtk fd` not `find`, `rtk bat` not `cat`.

### graphify

Knowledge graph at `graphify-out/`.

- Codebase questions: run `graphify query "<question>"` first (scoped subgraph). Use `graphify path "<A>" "<B>"` for relationships, `graphify explain "<concept>"` for focused concepts.
- Broad navigation: `graphify-out/wiki/index.md`. Broad architecture review: `graphify-out/GRAPH_REPORT.md`.
- **After modifying code, run `graphify update .`** (AST-only, no API cost) — or `/update-graph`.

---

## Rules

### 0. PRs only — never push to `main`
`rtk git checkout -b feat/name` → commit → push → `rtk gh pr create` → wait for approval.

### 1. Shared contracts are the single source of truth
Types/events/endpoint shapes live in `packages/shared-*`. **TS and Rust mirrors must stay in parity.** Don't redefine a contract locally in the hub, plugin, or a route — import it.

### 2. Tables first
Analytics/list views are TanStack **Table** (sort / filter / group / global-search / column visibility), not KPI cards. Use TanStack **Virtual** for large lists. Cards are for single-entity summaries only.

### 3. Design tokens only — no hardcoded styling
Use `shared-design-tokens` (Apple-derived). No raw hex in `className`/CSS. Single accent (Action Blue) for interactive elements; the one product shadow is for hero imagery only; surface-color change is the section divider. Dense UI ramp (13–14px) for tables/chrome; large Apple sizes for hero/empty states.

### 4. Dynamic sources — never hardcode a tool
A new tool = a `sources` row + capabilities + (optional) mapping rules. Built-in presets are seed rows, not branches. Ingestion accepts unknown sources (auto-detect → Integrations inbox). `source` ≠ `provider` ≠ `agent` — three independent analytics dimensions.

### 5. Plugin boundaries
The Stream Deck plugin only talks to the Hub via `shared-sdk`. No log parsing, no SQLite, no analytics math in the plugin.

### 6. Routes are complete
Every route has a loader (TanStack Query prefetch), an error boundary, and is code-split. Detail routes power the drill-down chain Repository → Session → Task → Agent → Intervention → Metric.

### 7. No mock/placeholder data committed
No hardcoded metric arrays, no `unimplemented!()`, no invalid `:0` ports. Wire to the real DB/API or leave a tracked TODO with an issue — not fake numbers.

### 8. Observability & errors (Rust)
Typed errors and `tracing` spans; SQLite work off the async runtime. Don't invent ad-hoc logging.

---

## New-capability checklists

**New analytics metric**
1. `packages/shared-types` — add the metric type (TS + Rust). 2. migration/view if needed. 3. `src-tauri/src/analytics/` — query (dimensional: source/provider/agent/repo). 4. expose via Tauri command + Axum route. 5. `packages/shared-api-contracts` — request/response. 6. frontend table column / view. → `/add-metric`

**New ingestion source**
1. `sources` seed/preset row + `capabilities`. 2. preset adapter **or** `mapping_rules` for the `ConfigurableAdapter` (no recompile path). 3. confirm auto-detect surfaces it. 4. Integrations UI entry. → `/add-source`

**New API endpoint**
1. `packages/shared-api-contracts` — shape. 2. `src-tauri/src/routes/` — Axum handler. 3. mirror as Tauri command if the UI needs IPC. 4. `shared-sdk` method. 5. frontend hook. → `/add-endpoint`

**New route** → `/add-route` · **New Stream Deck monitor** → `/add-monitor`

---

## Quick reference

| What | Where |
| --- | --- |
| Tauri entry (spawns server) | `apps/ai-engineering-hub/src-tauri/src/main.rs` |
| Core bootstrap (`run`/`bootstrap`) | `apps/ai-engineering-hub/core/src/lib.rs` |
| Ingestion (adapters, watcher, registry) | `apps/ai-engineering-hub/core/src/ingestion/`, `core/src/sources.rs` |
| Analytics queries | `apps/ai-engineering-hub/core/src/analytics.rs` |
| Repository intelligence | `apps/ai-engineering-hub/core/src/intelligence.rs` |
| Axum routes + WS | `apps/ai-engineering-hub/core/src/server.rs` |
| Migrations | `apps/ai-engineering-hub/src-tauri/migrations/` |
| Frontend app | `apps/ai-engineering-hub/src/frontend/src/` |
| Routes (file-based) | `apps/ai-engineering-hub/src/frontend/src/routes/` |
| Three-panel chrome | `apps/ai-engineering-hub/src/frontend/src/components/layout/` |
| API hooks (TanStack Query) | `apps/ai-engineering-hub/src/frontend/src/api/` |
| Stream Deck plugin | `apps/streamdeck-plugin/` |
| Shared contracts | `packages/shared-{types,events,api-contracts,sdk}/` |
| Design tokens | `packages/shared-design-tokens/` |
| Design artifacts | `design/` · `design/DESIGN-apple.md` |
| Docs | `docs/` |

---

## Agents / Commands / Skills — invoke EXPLICITLY

This project ships a `.claude/` agent system. **Unlike auto-routed setups, you invoke it explicitly:** when you work an area, run the matching command and/or engage the matching agent and load its skill. Agents are read-only reviewers/specialists; orchestrate them from the main session (agents don't call agents).

| When you touch… | Explicitly invoke |
| --- | --- |
| Rust backend / Axum / SQLx / Tauri | `/review-backend` + `rust-backend-architect` · skill `backend-standards` |
| Ingestion / sources / adapters / mapping | `/add-source` or `/review-ingestion` + `ingestion-source-expert` · skill `ingestion-standards` |
| Analytics / metrics / queries | `/add-metric` or `/review-analytics` + `analytics-engine-expert` · skill `analytics-standards` |
| DB schema / migrations | `/db-migrate` + `rust-backend-architect` · skill `backend-standards` |
| React / TanStack / routes / tables | `/review-frontend` (+ `/add-route`) + `tanstack-frontend-expert` · skill `frontend-standards` |
| Design tokens / styling | `/review-design` + `design-system-steward` · skill `design-system` |
| Shared contracts (TS/Rust) | `/review-contracts` + `contracts-architect` · skill `contracts-parity` |
| Stream Deck plugin / monitors | `/add-monitor` or `/review-streamdeck` + `streamdeck-plugin-expert` · skill `streamdeck-standards` |
| Security-bearing change | `/review-security` + `tauri-security-reviewer` |
| Perf-sensitive change | `/review-performance` + `performance-profiler` |
| Docs / design artifacts / knowledge | `/update-docs` + `project-steward`, then `/update-graph` |

- **Agents** (`.claude/agents/`): `rust-backend-architect`, `ingestion-source-expert`, `analytics-engine-expert`, `tanstack-frontend-expert`, `design-system-steward`, `contracts-architect`, `streamdeck-plugin-expert`, `tauri-security-reviewer`, `performance-profiler`, `project-steward`.
- **Commands** (`.claude/commands/`): reviews `/review-{backend,ingestion,analytics,frontend,design,contracts,streamdeck,security,performance}`; producers `/implement-feature`, `/fix-bug`, `/refactor-module`, `/add-{metric,source,endpoint,route,monitor}`, `/db-migrate`, `/update-docs`, `/update-graph`.
- **Skills** (`.claude/skills/`): `backend-standards`, `ingestion-standards`, `analytics-standards`, `frontend-standards`, `design-system`, `contracts-parity`, `streamdeck-standards`, `review-workflow`, `token-efficiency`.

---

## Commit conventions

Conventional Commits. Subject lower-case, imperative, ≤100 chars, no trailing period. Types: `feat`, `fix`, `perf`, `refactor`, `style`, `docs`, `build`, `ci`, `chore`, `revert`. Blank line before body.
