# API reference

The Hub exposes a REST API and a WebSocket, served by Axum **inside the Tauri process**, bound to
**`127.0.0.1:47800`** (localhost only). The desktop UI and the Stream Deck plugin both consume it;
the plugin does so through the typed [`shared-sdk`](../packages/shared-sdk) client.

- **Base URL:** `http://127.0.0.1:47800`
- **WebSocket:** `ws://127.0.0.1:47800/ws/events`
- **Content type:** `application/json`
- **Auth:** none — the server is localhost-bound and unauthenticated by design (see
  [SECURITY.md](../SECURITY.md)). CORS is permissive for local dev.

Request/response shapes are defined once in [`packages/shared-api-contracts`](../packages/shared-api-contracts)
and [`packages/shared-types`](../packages/shared-types) (TS), mirrored in Rust; routes live in
[core/src/server.rs](../apps/ai-engineering-hub/core/src/server.rs).

## Endpoints

| Method | Path | Description | Returns |
| --- | --- | --- | --- |
| `GET` | `/health` | Liveness check | `ok` (text) |
| `GET` | `/api/v1/repositories` | List repositories | `Repository[]` |
| `GET` | `/api/v1/repositories/{id}` | Get one repository | `Repository` (404 if missing) |
| `GET` | `/api/v1/sessions?repository_id={id}` | List sessions (optional filter) | `Session[]` |
| `GET` | `/api/v1/tasks?session_id={id}` | List tasks (optional filter) | `Task[]` |
| `GET` | `/api/v1/agents` | List agents (models) | `Agent[]` |
| `GET` | `/api/v1/sources` | List registered sources/tools | `Source[]` |
| `POST` | `/api/v1/sources/{id}/enabled` | Enable/disable a source | `{ "ok": true }` |
| `GET` | `/api/v1/analytics` | All analytics categories | `AnalyticsMetrics` |
| `GET` | `/api/v1/intelligence` | Repository intelligence | `Intelligence` |
| `POST` | `/api/v1/ingest` | Ingest one event or a batch | `{ "ingested": number }` |
| `GET` | `/ws/events` | WebSocket event stream | `HubEvent` messages |

## Examples

```bash
# Health
curl http://127.0.0.1:47800/health            # -> ok

# Analytics
curl http://127.0.0.1:47800/api/v1/analytics | jq .tokens.source_breakdown

# Enable a source (id from GET /api/v1/sources)
curl -X POST http://127.0.0.1:47800/api/v1/sources/<id>/enabled \
  -H "content-type: application/json" -d '{"enabled":true}'

# Ingest a single event (any tool / your own scripts)
curl -X POST http://127.0.0.1:47800/api/v1/ingest \
  -H "content-type: application/json" \
  -d '{"source":"my-tool","event_type":"token_usage","timestamp":"2026-06-08T12:00:00Z","payload":{"tokens":1500}}'

# Ingest a batch — send a JSON array of envelopes
curl -X POST http://127.0.0.1:47800/api/v1/ingest \
  -H "content-type: application/json" \
  -d '[{"source":"my-tool","event_type":"savings","payload":{"savings":420}}]'
```

## Core types

### `EventEnvelope` (ingest + WS)

The canonical, source-agnostic event shape. Unknown `source` keys auto-register (disabled) in the
registry and surface in the Integrations inbox.

```jsonc
{
  "source": "claude-code",        // dynamic source/tool key (required)
  "event_type": "token_usage",    // e.g. token_usage | savings | retrieval | task | …
  "timestamp": "2026-06-08T12:00:00Z", // RFC 3339; defaults to now if omitted
  "refs": {                        // optional drill-down references
    "repository_id": "repo:…",
    "session_id": "…",
    "task_id": "…",
    "agent_id": "…"
  },
  "payload": { "tokens": 1500 }    // canonical fields after mapping
}
```

### Entities

```jsonc
// Repository
{ "id": "repo:…", "name": "ai-engineering-hub", "path": "…", "metadata": null, "created_at": "…" }
// Session
{ "id": "…", "repository_id": "repo:…", "start_time": "…", "end_time": null, "status": "active" }
// Task
{ "id": "task:…", "session_id": "…", "description": "…", "status": "completed", "started_at": "…", "completed_at": null }
// Agent
{ "id": "agent:…", "name": "claude-opus-4-8", "provider": "anthropic", "model_id": "claude-opus-4-8" }
// Source
{ "id": "…", "key": "claude-code", "display_name": "Claude Code", "kind": "cli",
  "origin": "builtin_preset", "capabilities": { "emits_tokens": true }, "mapping_rules": null,
  "enabled": true, "last_seen_at": "…", "event_count": 54683 }
```

### `AnalyticsMetrics`

```jsonc
{
  "tokens":  { "daily_usage": 0, "weekly_usage": 0, "monthly_usage": 0,
               "repository_breakdown": [{ "label": "…", "value": 0 }],
               "provider_breakdown": [], "agent_breakdown": [], "source_breakdown": [] },
  "savings": { "by_source": [{ "label": "rtk", "value": 0 }], "total_savings": 0 },
  "productivity": { "first_pass_success": null, "intervention_rate": null, "retry_rate": null,
                    "task_completion_rate": null, "build_success": null, "test_success": null },
  "quality":  { "build_success": null, "test_success": null, "lint_success": null, "regressions": null },
  "retrieval":{ "accuracy": null, "latency": 73.5, "savings": 13555075 }
}
```

> **`null` vs `0`:** rate/score fields are `null` when **no connected tool reports that signal
> yet** — the UI renders these as "—", deliberately distinct from a real `0%`. See
> [Analytics](analytics.md).

### `Intelligence`

```jsonc
{
  "intervention_hotspots": [{ "label": "repo", "value": 0 }],
  "retry_hotspots": [],
  "expensive_agents": [{ "label": "claude-opus-4-8", "value": 0 }],
  "retrieval_bottlenecks": [{ "label": "rtk", "value": 73.5 }]
}
```

### `HubEvent` (WebSocket)

Messages are tagged. Subscribe and read JSON frames:

```jsonc
{ "type": "event",    "payload": { /* EventEnvelope */ } }
{ "type": "activity", "payload": { /* ActivityEvent  */ } }
```

```js
const ws = new WebSocket("ws://127.0.0.1:47800/ws/events");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

The Activity feed and the Stream Deck monitors are powered by this stream.

## Errors

Standard HTTP status codes with a JSON body `{ "error": "…" }`:

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `400` | Bad request (malformed body/params) |
| `404` | Not found (e.g. unknown repository id) |
| `500` | Internal error (logged via `tracing`) |

## Ingestion paths

`POST /api/v1/ingest` is the universal path, but it's not the only one — pull-based
**collectors** and a `notify` file watcher converge on the same `ingest` core. See
[Integrations](integrations.md).

## Adding an endpoint

See [guides/adding-an-endpoint.md](guides/adding-an-endpoint.md): shape in
`shared-api-contracts`, handler in `core/src/server.rs`, SDK method, frontend hook.
