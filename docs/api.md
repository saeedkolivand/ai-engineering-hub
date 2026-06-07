# API Documentation

## HTTP Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/repositories` | List repositories with analytics |
| `GET` | `/api/sessions` | List sessions |
| `GET` | `/api/tasks` | List tasks |
| `GET` | `/api/agents` | List agents |
| `GET` | `/api/metrics` | Retrieve metric records |
| `GET` | `/api/analytics` | Token usage analytics (daily, weekly, monthly) and total savings |
| `GET` | `/api/health` | Health check endpoint |

All endpoints return JSON payloads and are typed with `serde`.

## WebSocket Events

The WebSocket streams events of type `agentMetrics`:

```json
{
  "type": "agentMetrics",
  "metrics": [
    { "agent": "Claude", "tokensUsed": 12345, "tokensSaved": 2345 },
    { "agent": "RTK", "tokensUsed": 5678, "tokensSaved": 1023 },
    { "agent": "Graphify", "tokensUsed": 890, "tokensSaved": 150 }
  ]
}
```

Clients should subscribe to the `/ws/metrics` endpoint to receive real‑time updates.

## Tauri Commands (Frontend ↔ Backend)

- `start_backend` – placeholder to ensure the backend is ready.  
- Additional commands can be added in `src/backend/src/main.rs` as needed.

## Stream Deck Plugin Commands

- `get_latest_metrics` – Returns an array of the most recent metrics (placeholder implementation).

All commands are exposed via Tauri’s IPC layer and can be invoked from the frontend or a Stream Deck plugin.