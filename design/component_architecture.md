# Component Architecture

How the system decomposes into modules/components across the four layers. Complements
[domain_model.md](domain_model.md) (bounded contexts) and
[information_architecture.md](information_architecture.md) (navigation).

## Backend (`apps/ai-engineering-hub/core`, Tauri-free crate `aeh-core`)
Bounded-context modules, repository-pattern data access, thin service layer, DI via `AppState`.

```
lib.rs            bootstrap() / run() — init DB, seed presets, build state, serve
state.rs          AppState { pool, broadcast tx }, fixed port (47800)
db.rs             pool init (WAL), migrations
error.rs          AppError (typed) + IntoResponse
models.rs         entity rows + list queries (repositories/sessions/tasks/agents)
sources.rs        dynamic source registry (list/ensure/seed/enable) — auto-detection
ingestion/        mod.rs (ingest/ingest_batch), adapter.rs (Passthrough + Configurable),
                  watcher.rs (notify file watcher)
analytics.rs      dimensional metrics (tokens/savings/productivity/quality/retrieval)
intelligence.rs   hotspots/bottlenecks
server.rs         Axum router + handlers + WebSocket; serve(state, port)
```
The Tauri shell (`src-tauri/src/main.rs`) is thin: it spawns `aeh_core::run(...)` in
`setup()` so the API runs inside the single process.

## Frontend (`apps/ai-engineering-hub/src/frontend`)
```
main.tsx                  router + QueryClient providers; route-level pending/error defaults
routes/                   file-based routes (loaders + auto code-split); __root = AppShell
components/layout/        AppShell (three-panel), NavBar (10 items), RightPanel (Store),
                          Breadcrumbs, CommandPalette (Ctrl/Cmd-K + live search)
components/DataTable.tsx  reusable tables-first primitive (sort + global filter)
api/hooks.ts              TanStack Query hooks over the SDK
lib/                      hub (SDK client), queryClient, queries (queryOptions),
                          store (selection), format
```
Data flow: route `loader` → `queryClient.ensureQueryData(queryOptions)` → component
`useQuery(sameOptions)`; selections write to the TanStack Store that powers the RightPanel.

## Stream Deck plugin (`apps/streamdeck-plugin`)
```
src/plugin.ts    registers actions, streamDeck.connect()
src/actions.ts   MetricMonitor base + 9 SingletonAction monitors
src/hub.ts       shared-sdk HubClient (the only data path)
*.sdPlugin/      manifest.json (9 keypad actions) + bin/plugin.js (tsup bundle)
```

## Shared packages (`packages/*`)
`shared-types` and `shared-events` (TS + Rust mirrors, parity), `shared-api-contracts`
(endpoint shapes), `shared-sdk` (typed HubClient), `shared-design-tokens` (Apple tokens).
The hub, backend, and plugin all import contracts from here — never redefine.
