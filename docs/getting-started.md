# Getting started

This guide takes you from a clone to live metrics in a few minutes.

## 1. Prerequisites

| Requirement | Install | Check |
| --- | --- | --- |
| **Rust** (stable, 1.96+) | <https://rustup.rs> | `cargo --version` |
| **Node** 20+ | <https://nodejs.org> | `node --version` |
| **pnpm** 11 | `npm i -g pnpm` | `pnpm --version` |
| **Tauri OS deps** | WebView2 + MSVC Build Tools (Windows) · WebKitGTK (Linux) · Xcode CLT (macOS) | `pnpm tauri info` |

> `pnpm tauri info` prints a full environment check — handy if something won't build.

## 2. Install

```bash
git clone https://github.com/saeedkolivand/ai-engineering-hub.git
cd ai-engineering-hub
pnpm install
```

## 3. Run

The Hub is a single Tauri process that serves its own API and embeds the UI. The recommended way
to develop is to run the whole thing:

```bash
pnpm app:dev
```

This launches the desktop app: the React UI, the Axum API on `127.0.0.1:47800`, and the ingestion
collectors — all in one process.

### Browser-only alternative

If you're iterating on the UI and prefer the browser, run the API and the UI separately (the API
normally lives *inside* the app, so `pnpm dev` alone shows "Failed to fetch"):

```bash
pnpm dev:hub   # terminal 1 — Hub API (headless) on 127.0.0.1:47800
pnpm dev       # terminal 2 — Vite UI on http://localhost:5173
```

## 4. Enable your tools

Open **Integrations** in the app (or `GET http://127.0.0.1:47800/api/v1/sources`). The popular
tools ship as presets; **enable** the ones you use. Within ~5 seconds the collector reads that
tool's local data and backfills its history — repositories, sessions, tasks, tokens, savings.

Supported out of the box: **Claude Code, RTK, OpenCode, Cline** (and best-effort Gemini CLI). See
[Integrations](integrations.md) for what each reads and where.

## 5. Seed a quick event (optional)

Any tool — including your own scripts — can push canonical events over HTTP. This is also the
fastest way to see the UI light up:

```bash
curl -X POST http://127.0.0.1:47800/api/v1/ingest \
  -H "content-type: application/json" \
  -d '{"source":"my-tool","event_type":"token_usage","timestamp":"2026-06-08T12:00:00Z","payload":{"tokens":1500}}'
```

Unknown sources auto-register (disabled) in the Integrations inbox, ready to name and enable.

## 6. Explore

- **Overview** — counts + headline metrics.
- **Analytics** — token usage grouped by source / provider / agent / repository, plus savings and
  productivity. Rates with no reporting tool show "—" (see [Analytics](analytics.md)).
- **Repositories → Sessions → Tasks → Agents** — drill down; click a row to populate the right
  panel.
- **`⌘/Ctrl-K`** — command palette for fast navigation and search.
- **Activity** — the live WebSocket event feed.

## Next steps

- [Configuration](configuration.md) — change the port, find the database, theming.
- [Architecture](architecture.md) — how it all fits together.
- [Contributing](../CONTRIBUTING.md) — set up for development.
