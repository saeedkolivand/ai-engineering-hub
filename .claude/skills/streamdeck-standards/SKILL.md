---
name: streamdeck-standards
description: Stream Deck plugin standards — real Elgato manifest/actions, Hub-only via shared-sdk, the 9 monitors, and the hard no-logs/no-SQLite/no-analytics boundary. Load for changes under apps/streamdeck-plugin/**.
---

# Stream Deck standards

Authoritative: `design/stream_deck_architecture.md`.

## Hard boundaries (CRITICAL if violated)
The plugin must **never** parse logs, **never** access SQLite, **never** compute analytics. It only consumes the Hub.

## Required
- **Real Elgato plugin** — a `*.sdPlugin/manifest.json` with actions + UUIDs + a property inspector, registering over the Stream Deck WS protocol. Not a Tauri window.
- **Hub-only via `shared-sdk`** — all data from the Hub HTTP/WS through `shared-sdk` + `shared-events`. No inlined fetch shapes, no invalid `:0` port; handle reconnect.
- **All 9 monitors** — Token, Savings, Agent, Task, Intervention, Productivity, Build Health, Retrieval, **Context Health**.
- **Tokens-only** styling from `shared-design-tokens`.
