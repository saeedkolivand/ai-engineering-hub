# Backend API Reference

All endpoints are served under `http://localhost:3000/api`.

| Method | Path                 | Description                                 | Response Example |
|--------|----------------------|---------------------------------------------|------------------|
| GET    | `/repositories`      | List all repositories                        | `{ "repositories": [...] }` |
| GET    | `/sessions`          | List sessions                               | `{ "sessions": [...] }` |
| GET    | `/tasks`             | List tasks                                  | `{ "tasks": [...] }` |
| GET    | `/agents`            | List agents                                 | `{ "agents": [...] }` |
| GET    | `/analytics`         | Token, savings, productivity metrics        | `{ "tokens": [...], "savings": [...], "productivity": [...] }` |
| GET    | `/activity`          | Activity feed events                        | `{ "events": [...] }` |
| GET    | `/settings`          | Current user settings                       | `{ "theme": "light", "apiEndpoint": "...", "enableTelemetry": false }` |
| POST   | `/settings`          | Save user settings                          | `{ "success": true }` |
| GET    | `/health`            | Simple health check                         | `{ "status": "ok" }` |
| GET    | `/ws/metrics` (WS)   | WebSocket streaming live metric updates     | `HubEvent` messages |

All responses are JSON and conform to the contracts defined in
`packages/shared-api-contracts` (to be added).