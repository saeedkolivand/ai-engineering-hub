# Architecture Overview

The **AI Engineering Hub** is a single-process Tauri v2 desktop app (Rust) with a React +
TanStack frontend, plus a companion Elgato Stream Deck plugin. All Hub functionality runs in
one process; the only separate app is the plugin (launched by the Stream Deck software).

## Core components

| Layer | Technology | Responsibility | Location |
| --- | --- | --- | --- |
| Core | Rust · Axum · Tokio · SQLx · SQLite | HTTP/WS API, dynamic ingestion, analytics, intelligence | `apps/ai-engineering-hub/core` (`aeh-core`) |
| Desktop shell | Tauri v2 | Owns the process; spawns the core server in `setup()` | `apps/ai-engineering-hub/src-tauri` |
| Frontend | React · TanStack Router/Query/Table/Virtual/Form/Store | Three-panel operational UI | `apps/ai-engineering-hub/src/frontend` |
| Plugin | Elgato SDK v2 (Node) | 9 monitors consuming the Hub via shared-sdk | `apps/streamdeck-plugin` |
| Shared | TS + Rust contracts, SDK, tokens | Single source of truth | `packages/*` |

## Data flow
1. **Ingestion** (HTTP push `/api/v1/ingest`, file watcher, manual import) writes canonical
   `EventEnvelope`s to `raw_events`; unknown tools auto-register in the `sources` registry.
2. The **Axum server** (inside Tauri, `127.0.0.1:47800`) serves REST + a `/ws/events`
   broadcast. Ingested events are fanned out live.
3. The **frontend** and **plugin** both consume that one API (frontend via TanStack Query,
   plugin via the `shared-sdk` HubClient).

## Design principles
- **Dynamic, not hardcoded** — sources/tools are registry rows + capabilities + mapping
  rules; the 7 named tools are seed presets.
- **DDD / bounded contexts** — `ingestion`, `analytics`, `intelligence`, `realtime` modules;
  repository-pattern data access; thin service layer; DI via `AppState`.
- **Clean separation** — the Tauri-free `aeh-core` crate holds all logic; the shell is thin.
- **Single source of truth** — contracts in `packages/*` (TS↔Rust parity).
- **Observability** — `tracing` spans; typed errors.

See [domain_model.md](../design/domain_model.md), [component_architecture.md](../design/component_architecture.md),
[database.md](database.md), [api.md](api.md), [design-system.md](design-system.md).
