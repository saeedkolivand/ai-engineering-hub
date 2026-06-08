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
```
# Backend logic smoke check (no UI):
cargo run -p aeh-core --example smoke

# Desktop app (Tauri shell + frontend + embedded Axum API on 127.0.0.1:47800):
pnpm --filter ai-engineering-hub-frontend dev     # Vite dev server (:5173)
cargo run -p ai-engineering-hub-tauri             # launches the window + Hub API
```
The Tauri shell spawns the Axum server in `setup()`, so the desktop UI and the Stream Deck
plugin both consume `http://127.0.0.1:47800` (REST) and `ws://127.0.0.1:47800/ws/events`.

## Build (release)
```
# Frontend bundle
pnpm --filter ai-engineering-hub-frontend build    # -> src/frontend/dist

# Desktop app installer (uses tauri.conf.json bundle settings)
cargo tauri build                                  # or: pnpm dlx @tauri-apps/cli build
```
Bundle config: [src-tauri/tauri.conf.json](../apps/ai-engineering-hub/src-tauri/tauri.conf.json).
Add icons under `src-tauri/icons/` (`32x32.png`, `128x128.png`, `icon.ico`) before bundling.

## Stream Deck plugin
```
cd apps/streamdeck-plugin
pnpm build      # tsup -> com.aiengineering.monitor.sdPlugin/bin/plugin.js
```
Add icon assets under `com.aiengineering.monitor.sdPlugin/imgs/` (referenced by the manifest),
then package/install with the Elgato CLI:
```
pnpm dlx @elgato/cli pack com.aiengineering.monitor.sdPlugin    # -> .streamDeckPlugin
pnpm dlx @elgato/cli link com.aiengineering.monitor.sdPlugin    # dev install
```
The plugin requires the Hub to be running (it reads `http://127.0.0.1:47800`).

## CI
`.github/workflows/ci.yml` builds the Rust workspace and the JS workspaces. Automated tests
are deferred; `cargo run -p aeh-core --example smoke`, `vite build`, and `tsc --noEmit` are
the current green-gates.

## Performance targets
- Cold startup < 2s (DB init + migrations are cheap; the Axum server starts async in `setup()`).
- `raw_events` scales to millions of rows — all hot aggregations are indexed or use the
  hierarchy/`source`/`event_type` indexes; large UI lists use TanStack Virtual.
