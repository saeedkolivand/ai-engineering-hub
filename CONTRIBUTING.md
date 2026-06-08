# Contributing to AI Engineering Hub

Thanks for your interest in contributing! This guide gets you productive quickly and explains
the few **load-bearing invariants** that keep the project coherent.

## Table of contents

- [Development setup](#development-setup)
- [Repository layout](#repository-layout)
- [Running & building](#running--building)
- [Architectural invariants](#architectural-invariants-please-read)
- [Coding standards](#coding-standards)
- [Commit & PR workflow](#commit--pr-workflow)
- [Adding things (how-to)](#adding-things-how-to)

## Development setup

| Requirement | Notes |
| --- | --- |
| **Rust** (stable, 1.96+) | `rustup default stable` |
| **Node** 20+ and **pnpm** 11 | `npm i -g pnpm` |
| **Tauri v2 OS deps** | WebView2 + MSVC Build Tools (Windows); WebKitGTK (Linux); Xcode CLT (macOS) |

```bash
git clone https://github.com/saeedkolivand/ai-engineering-hub.git
cd ai-engineering-hub
pnpm install          # JS workspaces
cargo fetch           # Rust workspace
pnpm app:dev          # run the full app
```

## Repository layout

A pnpm + Cargo + Turbo monorepo. See [docs/architecture.md](docs/architecture.md) for the full
map; the short version:

- `apps/ai-engineering-hub/core` — Rust core (`aeh-core`): Axum, SQLx/SQLite, ingestion,
  analytics, intelligence. **All business logic lives here.**
- `apps/ai-engineering-hub/src-tauri` — thin Tauri v2 shell.
- `apps/ai-engineering-hub/src/frontend` — React + TanStack UI.
- `apps/streamdeck-plugin` — Elgato plugin (consumes the Hub API only).
- `packages/shared-*` — the single source of truth for types, events, contracts, the SDK, and
  design tokens.

## Running & building

| Command | What it does |
| --- | --- |
| `pnpm app:dev` | Integrated desktop app (UI + API + collectors) |
| `pnpm dev:hub` + `pnpm dev` | Browser dev (headless API + Vite UI) |
| `cargo run -p aeh-core --example smoke` | Backend logic smoke check (no server) |
| `cargo build --workspace` | Build the Rust workspace |
| `pnpm build` | Build all JS workspaces |
| `pnpm --filter ai-engineering-hub-frontend exec tsc --noEmit` | Frontend typecheck |

There is no compile-time database, so SQLx uses the runtime `query`/`query_as` API (not the
`query!` macro). Migrations live in `apps/ai-engineering-hub/src-tauri/migrations/`.

## Architectural invariants (please read)

These are what keep the project from sprawling. PRs that violate them will be asked to change.

1. **One process, no sidecars.** The Axum HTTP+WS server runs *inside* the Tauri process on a
   fixed localhost port. No Node/Python/Go services, no helper executables. (The Stream Deck
   plugin is the one separate app — it's launched by Elgato software.)
2. **Sources are data, not code.** A new tool is a `sources` registry row + capabilities +
   (optionally) mapping rules — never a hardcoded `enum` or `if tool == "x"` branch.
3. **Shared contracts are the source of truth.** Types/events/endpoint shapes live in
   `packages/shared-*`, and the **TS and Rust mirrors must stay in parity**. Don't redefine a
   contract locally.
4. **Tables first.** Analytics/list views are TanStack **Table** (sort/filter/group/search), not
   KPI cards. Cards are for single-entity summaries.
5. **Design tokens only.** Use `shared-design-tokens` — no raw hex in CSS/`className`.
6. **Plugin boundaries.** The plugin talks to the Hub via `shared-sdk` only — never parses logs,
   touches SQLite, or computes analytics.
7. **No mock/placeholder data.** Wire to the real DB/API or render an honest empty state ("—").
   No fake numbers, no `unimplemented!()`.

## Coding standards

- **Rust:** typed errors (`thiserror`) + `tracing` spans; keep SQLite work off the hot path;
  `cargo fmt` + `cargo clippy`.
- **TypeScript:** strict mode; prefer the shared types; route loaders + error boundaries for new
  routes; format with the repo's Prettier defaults.
- **After changing code**, keep the knowledge graph current: `graphify update .`.

## Commit & PR workflow

- **Branch, don't push to `main`:** `git checkout -b feat/your-thing`.
- **[Conventional Commits](https://www.conventionalcommits.org/):** `feat`, `fix`, `perf`,
  `refactor`, `docs`, `build`, `ci`, `chore`, … Subject in lower-case imperative, ≤100 chars, no
  trailing period.
- Open a PR; CI (`.github/workflows/ci.yml`) must be green. Fill in the PR template.
- One logical change per PR; include the *why* in the body.

## Adding things (how-to)

Step-by-step guides for the common extension points live in
**[docs/guides/](docs/guides/)**:

- [Add an ingestion source](docs/guides/adding-a-source.md)
- [Add an analytics metric](docs/guides/adding-a-metric.md)
- [Add an API endpoint](docs/guides/adding-an-endpoint.md)
- [Add a UI route](docs/guides/adding-a-route.md)
- [Add a Stream Deck monitor](docs/guides/adding-a-monitor.md)
