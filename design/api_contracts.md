# API Contracts: AI Engineering Hub

## 1. Overview
The API is divided into two main communication patterns:
1. **RESTful API (Axum)**: For request-response interactions, CRUD operations, and complex analytical queries.
2. **WebSocket API**: For real-time, low-latency event streaming.

All API responses use standard HTTP status codes. Error responses follow a unified format.

## 2. Error Format

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested repository with ID 'abc-123' was not found.",
    "details": {} 
  }
}
```

## 3. RESTful API Endpoints

### 3.1 Repositories
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/repositories` | List all repositories (supports pagination/filtering). |
| `GET` | `/api/repositories/:id` | Get details for a specific repository. |
| `POST` | `/api/repositories` | Register a new repository. |
| `DELETE` | `/api/repositories/:id` | Remove a repository and its associated data. |

### 3.2 Sessions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/repositories/:repo_id/sessions` | List sessions within a repository. |
| `GET` | `/api/sessions/:id` | Get details for a specific session. |
| `POST` | `/api/sessions` | Start a new session. |
| `PATCH` | `/api/sessions/:id` | Update session status or metadata. |

### 3.3 Tasks
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sessions/:session_id/tasks` | List tasks within a session. |
| `GET` | `/api/tasks/:id` | Get details for a specific task. |
| `POST` | `/api/tasks` | Create a new task. |
| `PATCH` | `/api/tasks/:id` | Update task status, description, or assignment. |

### 3.4 Agents
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/agents` | List all known agents. |
| `GET` | `/api/agents/:id` | Get details for a specific agent. |

### 3.5 Analytics
Queries support filters: `?start_date=...&end_date=...&provider=...&repository_id=...`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics/tokens` | Get token usage (breakdown by provider, repo, agent, etc.). |
| `GET` | `/api/analytics/savings` | Get cost/time savings metrics. |
| `GET` | `/api/analytics/productivity`| Get success/retry/intervention rates. |
| `GET` | `/api/analytics/quality` | Get build/test/lint/regression metrics. |
| `GET` | `/api/analytics/retrieval` | Get retrieval accuracy and latency metrics. |
| `GET` | `/api/analytics/intelligence/hotspots` | Get repository/workflow hotspots. |

### 3.6 Ingestion (Internal/Plugin)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ingest/log` | Ingest a raw log entry for parsing. |
| `POST` | `/api/ingest/json` | Ingest a structured JSON payload. |

## 4. WebSocket API

**Endpoint**: `ws://localhost:PORT/ws/events`

### 4.1 Communication Pattern
- **Server $\rightarrow$ Client**: Pushes `EventEnvelope<T>` objects.
- **Client $\rightarrow$ Server**: Sends subscription/unsubscription requests.

### 4.2 Subscriptions
Clients can filter the stream to reduce noise.

**Request (Client to Server):**
```json
{
  "action": "subscribe",
  "topic": "token_usage",
  "filters": {
    "repositoryId": "uuid-here"
  }
}
```

**Response (Server to Client):**
```json
{
  "action": "subscribed",
  "topic": "token_usage"
}
```

## 5. API Versioning
All endpoints are prefixed with `/api/v1/`.