# Architecture Documentation

## Domain Model

| Entity          | Description                                    |
|-----------------|------------------------------------------------|
| Repository      | Source code repository (id, name, path).      |
| Session         | Execution of a repository run (start/end).     |
| Task            | Individual unit of work within a session.      |
| Agent           | AI model instance (provider, model id).        |
| Metric          | Quantitative data (tokens, savings, etc.).     |
| ActivityEvent   | Timeline event linking repositories, tasks, agents.

## Bounded Contexts

1. **Metrics Collector** – ingest logs, JSON, files; store in SQLite.
2. **Analytics Engine** – compute token usage, savings, productivity.
3. **Repository Intelligence** – query repository‑level stats, hotspots.
4. **Frontend UI** – React app with TanStack tables, virtualized lists.
5. **Stream Deck Integration** – lightweight consumer of Hub WebSocket.

## Data Flow

```
[CLI / Tools] → Metrics Collector → SQLite DB → Analytics Engine →
   ↘︎                               ↙︎
   UI (React) ←→ Axum API ←→ WebSocket ← Stream Deck Plugin
```

All components run inside a single Tauri binary; no side‑car processes.

## Event Contracts

All events are defined in `packages/shared-api-contracts` (future addition) and
conform to the following TypeScript interface:

```ts
export interface HubEvent {
  type: 'tokenUsage' | 'savings' | 'buildStatus' | 'activity';
  payload: Record<string, unknown>;
}
```

## Persistence

SQLite schema (`src/backend/migrations`) includes tables for:

- `repositories`
- `sessions`
- `tasks`
- `agents`
- `metrics`
- `activity_events`

Migrations are managed via `sqlx migrate`.

## Extensibility

New bounded contexts can be added by:

1. Defining a domain model.
2. Adding migration scripts.
3. Exposing Axum routes.
4. Consuming the data in the frontend via TanStack Query.

All code follows clean‑architecture principles with dependency injection
via `tower::ServiceBuilder` in Rust and Context providers in React.