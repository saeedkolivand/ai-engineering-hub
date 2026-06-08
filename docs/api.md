# Hub API

The Axum server runs inside the Tauri process on `http://127.0.0.1:47800` (REST) and
`ws://127.0.0.1:47800/ws/events` (WebSocket). It is the single data source for the desktop
UI and the Stream Deck plugin. Contracts: [packages/shared-api-contracts](../packages/shared-api-contracts);
routes: [core/src/server.rs](../apps/ai-engineering-hub/core/src/server.rs). Prefer the typed
[shared-sdk](../packages/shared-sdk) `HubClient` over raw fetch.

## REST

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/health` | `"ok"` |
| GET | `/api/v1/repositories` | `Repository[]` |
| GET | `/api/v1/repositories/{id}` | `Repository` |
| GET | `/api/v1/sessions?repository_id=` | `Session[]` |
| GET | `/api/v1/tasks?session_id=` | `Task[]` |
| GET | `/api/v1/agents` | `Agent[]` |
| GET | `/api/v1/sources` | `Source[]` |
| POST | `/api/v1/sources/{id}/enabled` | `{ ok }` — body `{ enabled: boolean }` |
| GET | `/api/v1/analytics` | `AnalyticsMetrics` (tokens/savings/productivity/quality/retrieval) |
| GET | `/api/v1/intelligence` | hotspots/bottlenecks |
| POST | `/api/v1/ingest` | `{ ingested }` — body `EventEnvelope` or `EventEnvelope[]` |

## Ingestion (`POST /api/v1/ingest`)
Source-agnostic. Any tool posts canonical envelopes; unknown `source` keys auto-register
(disabled) in the registry and surface in the UI Integrations inbox.
```json
{ "source": "claude-code", "event_type": "token_usage", "timestamp": "2026-06-08T12:00:00Z",
  "refs": { "repository_id": "…" }, "payload": { "tokens": 1200 } }
```
Other paths: the `notify` file watcher (watched dirs/globs) and manual import — all converge
on the same `ingest` core.

## WebSocket (`/ws/events`)
Subscribers receive `HubEvent` frames as JSON: `{ "type": "event", "payload": EventEnvelope }`
or `{ "type": "activity", "payload": ActivityEvent }`. Used by the Activity feed and the
Stream Deck monitors.
