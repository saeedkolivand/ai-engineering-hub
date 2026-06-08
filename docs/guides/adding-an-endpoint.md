# Adding an API endpoint

A new endpoint = a contract + a handler + an SDK method + a frontend hook.

Example: **`GET /api/v1/sessions/{id}/interventions`** — list interventions for a session.

## 1. Contract (shared-api-contracts)

Define request/response in `packages/shared-api-contracts/src/index.ts`:

```typescript
export interface ListSessionInterventionsRequest {
  sessionId: string;
}

export interface ListSessionInterventionsResponse {
  interventions: Intervention[];
}
```

(Reuse `Intervention` from `shared-types` if it exists; define it if not.)

## 2. Axum handler (core/src/server.rs)

Add a route + handler:

```rust
// In the router setup (e.g., in the `/api/v1` scope):
.route("/sessions/:id/interventions", get(list_session_interventions))

// Handler:
async fn list_session_interventions(
    Path(session_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ListSessionInterventionsResponse>, AppError> {
    let interventions = sqlx::query_as::<_, InterventionRow>(
        "SELECT * FROM interventions WHERE session_id = ? ORDER BY timestamp DESC"
    )
    .bind(&session_id)
    .fetch_all(&state.pool)
    .await?;
    
    Ok(Json(ListSessionInterventionsResponse {
        interventions: interventions.into_iter().map(|r| r.into()).collect(),
    }))
}
```

Add the route to the exported router in `pub fn create_router()`.

## 3. SDK method (shared-sdk)

Add a typed client method in `packages/shared-sdk/src/index.ts`:

```typescript
import { HubClient } from "@tauri-apps/plugin-http";

export class HubClient {
  // ... existing methods

  async listSessionInterventions(
    sessionId: string
  ): Promise<ListSessionInterventionsResponse> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/sessions/${sessionId}/interventions`
    );
    return res.json();
  }
}
```

Export the response type:

```typescript
export * from "./contracts";  // Re-export shared-api-contracts
```

## 4. Frontend hook (api/hooks.ts)

Wrap the SDK call with TanStack Query for caching + refetch:

```typescript
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useSessionInterventions(sessionId: string | null) {
  const client = useMemo(() => new HubClient(HUB_BASE), []);

  return useQuery({
    queryKey: ["session", sessionId, "interventions"],
    queryFn: () => client.listSessionInterventions(sessionId!),
    enabled: !!sessionId,
  });
}
```

## 5. Frontend component (routes or components)

Use the hook in a component:

```tsx
import { useSessionInterventions } from "../api/hooks";

export function SessionInterventions({ sessionId }: Props) {
  const { data, isLoading, error } = useSessionInterventions(sessionId);

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Impact</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {data?.interventions.map((iv) => (
          <tr key={iv.id}>
            <td>{iv.description}</td>
            <td>{iv.impact}</td>
            <td>{new Date(iv.timestamp).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 6. Test it

```bash
cargo build --workspace
pnpm app:dev
```

Curl:

```bash
curl http://127.0.0.1:47800/api/v1/sessions/session-123/interventions | jq
```

Frontend: navigate to a session and see interventions in the RightPanel or a detail view.

## Error handling

Use typed errors. In the handler, return `AppError::NotFound` for a missing session:

```rust
let interventions = sqlx::query_as::<_, InterventionRow>(
    "SELECT * FROM interventions WHERE session_id = ?"
)
.bind(&session_id)
.fetch_all(&state.pool)
.await?;

if interventions.is_empty() {
    return Err(AppError::NotFound("session not found".into()));
}

Ok(Json(ListSessionInterventionsResponse { interventions: ... }))
```

---

Related: [API reference](../api.md) · [Architecture](../architecture.md)
