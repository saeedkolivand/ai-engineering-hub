# Deployment & Packaging

## Prerequisites
- Rust (stable) + Cargo, Node 20+ + pnpm 11, and the Tauri v2 OS prerequisites
  (WebView2 on Windows; WebKitGTK on Linux; Xcode CLT on macOS).

## Install
```
pnpm install            # JS workspaces (frontend, plugin, shared-*)
cargo fetch             # Rust workspace
```

## Run (dev)
The Hub API lives **inside the Tauri process** in production. For browser-based UI dev you run
two things — the API and the UI — because `pnpm dev` starts the Vite UI **only** (without the
API you'll see "Could not load. Failed to fetch / Is the Hub running?").

```
# Terminal 1 — Hub API (headless Axum server on 127.0.0.1:47800):
pnpm dev:hub                  # = cargo run -p aeh-core --example serve

# Terminal 2 — UI (Vite dev server on :5173):
pnpm dev                      # = turbo dev (frontend)
```
Seed some data so the views aren't empty:
```
curl -X POST http://127.0.0.1:47800/api/v1/ingest -H "content-type: application/json" \
  -d '{"source":"claude-code","event_type":"token_usage","timestamp":"2026-06-08T12:00:00Z","payload":{"tokens":1500}}'
```

Or run the **integrated desktop app** (one process — embeds the UI and starts the Axum
server + collectors in-process, exactly like the packaged build):
```
pnpm app:dev                             # = (cd apps/ai-engineering-hub && tauri dev)
```
Other entry points:
```
cargo run -p aeh-core --example smoke    # backend logic smoke check (no server)
```
The desktop UI and the Stream Deck plugin both consume `http://127.0.0.1:47800` (REST) and
`ws://127.0.0.1:47800/ws/events`.

## Build (release)
The Tauri CLI is a workspace devDependency (`@tauri-apps/cli`), so one command builds the
frontend (via `beforeBuildCommand`) and produces the desktop installer:
```
pnpm app:build           # = (cd apps/ai-engineering-hub && tauri build) -> MSI + NSIS on Windows
```
The output exe runs everything in a single process — the embedded React UI plus the Axum
server and the ingestion collectors (started in `setup()`); no separate `dev:hub` needed.
Bundle config: [src-tauri/tauri.conf.json](../apps/ai-engineering-hub/src-tauri/tauri.conf.json).
App icons live in `src-tauri/icons/` (already committed: `32x32.png`, `128x128.png`,
`128x128@2x.png`, `icon.ico`). Regenerate with `pnpm tauri icon <path-to-1024px.png>`.

## Stream Deck plugin
The Elgato CLI (`@elgato/cli`) is a devDependency, and icons are committed under
`com.aiengineering.monitor.sdPlugin/imgs/`. From `apps/streamdeck-plugin`:
```
pnpm build         # tsup -> com.aiengineering.monitor.sdPlugin/bin/plugin.js (self-contained)
pnpm sd:validate   # validate the manifest + assets
pnpm sd:pack       # -> com.aiengineering.monitor.streamDeckPlugin (installable bundle)
pnpm sd:link       # dev-install into the Stream Deck app
```
Install by double-clicking the generated `.streamDeckPlugin`, or use `pnpm sd:link`. The plugin
requires the Hub to be running (it reads `http://127.0.0.1:47800`).

## CI
`.github/workflows/ci.yml` builds the Rust workspace and the JS workspaces. Automated tests
are deferred; `cargo run -p aeh-core --example smoke`, `vite build`, and `tsc --noEmit` are
the current green-gates.

## Performance targets
- Cold startup < 2s (DB init + migrations are cheap; the Axum server starts async in `setup()`).
- `raw_events` scales to millions of rows — all hot aggregations are indexed or use the
  hierarchy/`source`/`event_type` indexes; large UI lists use TanStack Virtual.
