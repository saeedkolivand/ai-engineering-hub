# Adding a frontend route

Routes are **file-based** with `@tanstack/react-router`. Every route has a loader (TanStack Query prefetch), an error boundary, and is code-split.

Example: **`/tasks/:id`** — view a task's details.

## 1. Create the route file

`apps/ai-engineering-hub/src/frontend/src/routes/tasks.$id.tsx`:

```typescript
import { useParams } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useTask } from "../api/hooks";

export const Route = createFileRoute("/tasks/$id")({
  // Prefetch on route load (TanStack Query)
  loader: async ({ params }) => {
    // queryClient.prefetchQuery() — shown below
  },
  // Error boundary
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  // Main component (code-split automatically by Router)
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { id } = useParams({ from: "/tasks/$id" });
  const { data: task, isLoading, error } = useTask(id);

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>{task.description}</h1>
      <p>Status: {task.status}</p>
      <p>Session: {task.session_id}</p>
      {/* Drill-down: link to agents involved */}
      {task.agent_ids?.map((aid) => (
        <a key={aid} href={`/agents/${aid}`}>
          {aid}
        </a>
      ))}
    </div>
  );
}
```

## 2. Add the hook (api/hooks.ts)

If it doesn't exist, create `useTask()`:

```typescript
import { useQuery } from "@tanstack/react-query";

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const res = await fetch(`${HUB_BASE}/api/v1/tasks/${id}`);
      if (!res.ok) throw new Error(`Task ${id} not found`);
      return res.json() as Promise<Task>;
    },
  });
}
```

## 3. Add the loader (optional but recommended)

In the route file, flesh out the `loader`:

```typescript
import { queryClient } from "../lib/queryClient";

export const Route = createFileRoute("/tasks/$id")({
  loader: async ({ params }) => {
    // Prefetch on route load so data is ready when the component mounts
    await queryClient.prefetchQuery({
      queryKey: ["task", params.id],
      queryFn: () => useTask(params.id),
    });
  },
  // ...
});
```

This makes the page faster — data is already fetched before the component renders.

## 4. Drill-down linking

Routes are hierarchical. Link tasks to their sessions, sessions to repos:

```tsx
<a href={`/sessions/${task.session_id}`}>
  See session
</a>
```

The router auto-manages the dynamic `$id` segment based on the file name.

## 5. RightPanel integration

When a task is selected (e.g., via a table click), populate the **RightPanel** with its details using a **TanStack Store** selection state:

```typescript
// In a parent component or Table:
import { useStore } from "../store";

function TaskRow({ task }) {
  const setSelection = useStore((s) => s.setSelection);

  return (
    <tr onClick={() => setSelection({ type: "task", id: task.id })}>
      <td>{task.description}</td>
    </tr>
  );
}

// RightPanel reads the selection and shows task details
function RightPanel() {
  const selection = useStore((s) => s.selection);
  if (selection?.type !== "task") return null;

  const { data: task } = useTask(selection.id);
  return <div>{/* task details */}</div>;
}
```

## 6. Error boundary

The route's `errorComponent` is invoked if the loader or the component throw:

```typescript
errorComponent: ({ error }) => (
  <div style={{ padding: "1rem", color: "red" }}>
    <h2>Failed to load task</h2>
    <pre>{error instanceof Error ? error.message : String(error)}</pre>
  </div>
)
```

## 7. Test it

```bash
pnpm dev
# or
pnpm app:dev
```

Navigate to `http://localhost:5173/tasks/task-123` (or the desktop app).

## File structure

```
src/routes/
  +.tsx                          // Root layout + Router outlet
  index.tsx                       // / (Overview)
  repositories.$id.tsx            // /repositories/:id
  repositories.$id.sessions.tsx   // /repositories/:id/sessions (nested)
  tasks.$id.tsx                   // /tasks/:id
  tasks.$id.interventions.tsx     // /tasks/:id/interventions (nested)
  settings.tsx                    // /settings
  ... (etc.)
```

TanStack Router matches routes by file name (`.` = `/` in the path, `$` = dynamic segment).

---

Related: [Architecture](../architecture.md) · [API reference](../api.md)
