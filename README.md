# AI Engineering Hub

A production-grade **AI Engineering Operations Platform**: a single Tauri v2 desktop app that
ingests metrics from any AI dev tool, computes analytics + repository intelligence, and serves
a local API/WebSocket consumed by its own React UI and a companion Stream Deck plugin.

Target feel: GitHub / Linear / Datadog density with Apple-grade restraint — an operational
tool, not a dashboard.

## What it does
- **Metrics collector** — source-agnostic ingestion (HTTP push, file watcher, manual import).
  Tools are **data, not code**: the named tools (Claude Code, OpenCode, Cline, Gemini CLI,
  RTK, Graphify, CodeGraph) ship as presets; any other tool auto-registers on first event.
- **Analytics engine** — tokens, savings, productivity, quality, retrieval — all dimensional
  (group by source / provider / agent / repository).
- **Repository intelligence** — intervention/retry hotspots, expensive agents, retrieval
  bottlenecks.
- **Operational UI** — three-panel layout, 10-item nav, drill-down (repo → session → task →
  agent), tables-first, Ctrl/Cmd-K command palette, live activity feed.
- **Stream Deck plugin** — 9 monitors (incl. Context Health) consuming the Hub.

## Stack
- Backend: Rust · Tauri v2 · Tokio · Axum · SQLx · SQLite (single process; Axum runs inside Tauri).
- Frontend: React · TypeScript · TanStack Router/Query/Table/Virtual/Form/Store.
- Plugin: Elgato Stream Deck SDK v2.
- Shared: `packages/shared-{types,events,api-contracts,sdk,design-tokens}` (TS↔Rust parity).

## Layout
```
apps/ai-engineering-hub/{core, src-tauri, src/frontend}
apps/streamdeck-plugin
packages/shared-{types,events,api-contracts,sdk,design-tokens}
```

## Quick start
```
pnpm install
pnpm app:dev    # integrated desktop app — one process (UI + Hub API + collectors)
```
`pnpm app:dev` runs the real Tauri app: the Axum server and the ingestion collectors start
in-process, so enabling an integration immediately reads that tool's local data.

For **browser-only** UI dev you instead run two processes (the API normally lives inside the
Tauri app, so `pnpm dev` alone shows "Failed to fetch"):
```
pnpm dev:hub    # terminal 1 — Hub API on 127.0.0.1:47800
pnpm dev        # terminal 2 — Vite UI on :5173
```
Backend-only smoke check: `cargo run -p aeh-core --example smoke`.
Release installer: `pnpm app:build`. See [docs/deployment.md](docs/deployment.md) for details,
and [docs/integrations.md](docs/integrations.md) for how each tool's data is collected.

## Docs
[Architecture](docs/architecture.md) · [API](docs/api.md) · [Database](docs/database.md) ·
[Design system](docs/design-system.md) · [Stream Deck](docs/streamdeck.md) ·
[Contributing](docs/CONTRIBUTING.md) · design artifacts in [design/](design/).

## Working in this repo
See [CLAUDE.md](CLAUDE.md) for project rules and the explicitly-invoked `.claude/` agent system
(agents/commands/skills).

## License
MIT.
