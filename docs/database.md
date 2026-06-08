# Database

The Hub stores everything in a single local **SQLite** database (WAL mode). It's the landing zone
for ingested events and the drill-down hierarchy. Schema:
[src-tauri/migrations/](../apps/ai-engineering-hub/src-tauri/migrations/); pool/pragmas:
[core/src/db.rs](../apps/ai-engineering-hub/core/src/db.rs).

## Where it lives

| Context | Path |
| --- | --- |
| Packaged / `pnpm app:dev` | `hub.sqlite` in the OS app-data dir (resolved by Tauri) |
| Headless dev (`pnpm dev:hub`) | `hub-dev.sqlite` in the working directory |
| Tests / smoke | in-memory |

Dev databases are disposable — delete `hub-dev.sqlite*` to start fresh. See
[Configuration](configuration.md).

## Schema

```mermaid
erDiagram
  sources ||--o{ raw_events : "source_id"
  repositories ||--o{ sessions : ""
  repositories ||--o{ raw_events : ""
  sessions ||--o{ tasks : ""
  sessions ||--o{ raw_events : ""
  tasks ||--o{ raw_events : ""
  tasks }o--o{ agents : "task_agents"
  tasks ||--o{ interventions : ""
  agents ||--o{ raw_events : ""

  sources {
    text id PK
    text key UK
    text capabilities "JSON"
    text mapping_rules "JSON"
    int  enabled
    int  event_count
  }
  raw_events {
    text id PK "deterministic (dedup)"
    text timestamp
    text source
    text source_id FK
    text event_type
    text payload "JSON"
    text repository_id FK
    text session_id FK
    text task_id FK
    text agent_id FK
  }
  repositories { text id PK; text name; text path }
  sessions { text id PK; text repository_id FK; text status }
  tasks { text id PK; text session_id FK; text status }
  agents { text id PK; text name; text provider }
  interventions { text id PK; text task_id FK; text agent_id FK }
```

### Tables

- **`sources`** — the dynamic tool registry. Tools are rows, not code; the named tools are seed
  presets. `capabilities`/`mapping_rules` are JSON. → [Integrations](integrations.md)
- **`raw_events`** — the high-volume landing table. `payload` is JSON; `source` is denormalized
  for fast group-by. `source` / `provider` / `agent` / `repository` are **independent
  dimensions**. The primary key is a **deterministic id** so collectors can `INSERT OR IGNORE`
  (idempotent re-scans and restarts).
- **`repositories` · `sessions` · `tasks` · `agents`** — the drill-down hierarchy, upserted by
  collectors.
- **`task_agents`** — many-to-many between tasks and agents.
- **`interventions`** — human-intervention records (fed by tools that report them).

### Indexes

```
idx_raw_events_timestamp   (timestamp)
idx_raw_events_type        (event_type)
idx_raw_events_source      (source)
idx_raw_events_hierarchy   (repository_id, session_id, task_id, agent_id)
idx_sessions_repo          (sessions.repository_id)
idx_tasks_session          (tasks.session_id)
idx_interventions_task     (interventions.task_id)
```

All hot aggregations hit an index; `raw_events` is designed to scale to millions of rows. The
indexes back the queries in [analytics.rs](../apps/ai-engineering-hub/core/src/analytics.rs) and
[intelligence.rs](../apps/ai-engineering-hub/core/src/intelligence.rs).

## Pragmas & FKs

Set at pool init: WAL journaling, `synchronous = NORMAL`, a busy timeout, and a small pool. SQLx
enables foreign-key enforcement per connection — so collectors upsert parent rows (repo → session
→ task) **before** the `raw_events` row that references them.

## Migrations & querying

SQL migrations live in [src-tauri/migrations/](../apps/ai-engineering-hub/src-tauri/migrations/)
and run automatically on startup (`sqlx::migrate!`). Add a new timestamped `.sql` file to evolve
the schema (`/db-migrate` scaffolds one). There is no compile-time database, so queries use the
runtime `query`/`query_as` API; integer `SUM` aggregates that decode to `f64` are wrapped in
`CAST(… AS REAL)`.
