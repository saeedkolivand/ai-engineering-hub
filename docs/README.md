# Documentation

Welcome to the AI Engineering Hub handbook. Start with **[Getting started](getting-started.md)**,
then dive into whatever you need.

## By goal

**I want to run it**
- [Getting started](getting-started.md) — install, run, enable a tool, see data
- [Configuration](configuration.md) — ports, data directory, settings, theme
- [Troubleshooting](troubleshooting.md) — common issues & fixes
- [Deployment](deployment.md) — release builds & packaging

**I want to understand it**
- [Architecture](architecture.md) — process model, bounded contexts, data flow
- [Database](database.md) — schema, ERD, indexes, migrations
- [Analytics](analytics.md) — metric catalog, dimensions, the "—" semantics
- [API reference](api.md) — REST + WebSocket, types, errors

**I want to extend it**
- [Integrations](integrations.md) — how collectors work + how to add a tool
- [Design system](design-system.md) — tokens, theming, density
- [Stream Deck plugin](streamdeck.md) — monitors, build, package
- [Contributor guides](guides/) — add a source / metric / endpoint / route / monitor

## Conventions in these docs

- Paths are repository-relative (e.g. `apps/ai-engineering-hub/core/src/lib.rs`). Local data
  locations use tool-standard, machine-independent forms (e.g. `~/.claude/projects`,
  `%LOCALAPPDATA%/rtk`).
- The Hub serves on the fixed local address **`http://127.0.0.1:47800`** (REST) and
  **`ws://127.0.0.1:47800/ws/events`** (WebSocket).
- Design specifications (the "why") live in [../design/](../design/); this handbook is the
  "how".

## Project map

```
apps/
  ai-engineering-hub/{core, src-tauri, src/frontend}   the Hub (one Tauri process)
  streamdeck-plugin/                                    the Elgato plugin
packages/
  shared-{types, events, api-contracts, sdk, design-tokens}   the shared contracts
docs/        this handbook
design/      design specifications
```
