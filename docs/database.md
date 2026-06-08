# Database

SQLite, local-first, embedded in the Tauri process. Opened with WAL + `synchronous=NORMAL`
for high write throughput; migrations run at startup via `sqlx::migrate!`.

- Pool init: [core/src/db.rs](../apps/ai-engineering-hub/core/src/db.rs) (`init_pool` / `init_memory_pool`).
- Schema: [src-tauri/migrations/](../apps/ai-engineering-hub/src-tauri/migrations/).
- Default location: the Tauri app data dir (`hub.sqlite`).

## Tables

| Table | Purpose | Key columns |
| --- | --- | --- |
| `sources` | Dynamic tool/source registry (data, not code) | `key` (unique slug), `display_name`, `kind`, `origin` (`builtin_preset`/`auto_detected`/`user_defined`), `capabilities` (JSON), `mapping_rules` (JSON), `enabled`, `last_seen_at`, `event_count` |
| `repositories` | Repos | `id`, `name`, `path`, `metadata` (JSON) |
| `sessions` | Sessions per repo | `repository_id` → repositories |
| `tasks` | Tasks per session | `session_id` → sessions |
| `agents` | Agents | `name`, `provider`, `model_id` |
| `task_agents` | Task↔agent join | PK(`task_id`,`agent_id`) |
| `interventions` | Human interventions on tasks | `task_id`, `agent_id`, `impact` |
| `raw_events` | High-volume event landing table | `timestamp`, `source`, `source_id`, `event_type`, `payload` (JSON), `repository_id`/`session_id`/`task_id`/`agent_id` |

`source`, `provider`, and `agent` are **independent analytics dimensions**. `source` is
denormalized onto `raw_events` for fast group-by; `source_id` FKs the registry.

## Indexes

`raw_events`: `timestamp`, `event_type`, `source`, and the hierarchy tuple
`(repository_id, session_id, task_id, agent_id)`. Plus `sessions(repository_id)`,
`tasks(session_id)`, `interventions(task_id)`. These back the dimensional aggregations in
[core/src/analytics.rs](../apps/ai-engineering-hub/core/src/analytics.rs) and the hotspot
queries in [core/src/intelligence.rs](../apps/ai-engineering-hub/core/src/intelligence.rs).

## Migrations

Forward-safe, single canonical set. Add a new timestamped `*.sql` file under
`src-tauri/migrations/`; it runs automatically on next launch. Use `/db-migrate` to scaffold
one (keep changes reversible-or-guarded; index any new hot path).

## Querying

All access uses **runtime** `sqlx::query`/`query_as` (no compile-time DB needed). Aggregates
that decode to `f64` are wrapped in `CAST(... AS REAL)` because SQLite returns integer sums
as INTEGER and sqlx is strict about numeric decoding.
