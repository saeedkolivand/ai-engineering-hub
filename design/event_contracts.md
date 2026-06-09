# Event Contracts: AI Engineering Hub

> **Status: partially superseded — do not treat this file as the implemented contract.**
>
> The envelope shape documented below (`id`/`version`/`type`/`metadata`) and several event names
> (`build_result`, `test_result`, `intervention_occurred`, `task_status_changed`) differ from the
> shipped implementation. The authoritative implemented contract is:
>
> - Envelope: `packages/shared-events` — fields are `source`/`event_type`/`timestamp`/`refs`/`payload`
>   (no `id`, no `version`, no `metadata` object).
> - Quality/productivity event types: `build` (payload: `build_status`, `command`), `test`
>   (payload: `test_status`, `command`, `regression`), `lint` (payload: `lint_status`, `command`),
>   `intervention` (payload: `reason`).
> - Analytics signal coverage: see [docs/analytics.md](../docs/analytics.md) for which fields are
>   live from the Claude Code collector and which still require an external push.
>
> This document is retained as a design-history artifact. Update it or supersede it before
> referencing it as a specification.

## 1. Overview
The system uses an event-driven architecture. All communication between components (Backend $\leftrightarrow$ Frontend, Backend $\leftrightarrow$ Stream Deck) is mediated by strongly typed events. These contracts are defined in the `packages/shared-events` package.

## 2. Event Envelope
Every event follows a standardized envelope to ensure consistent handling and routing.

```typescript
/**
 * Standard envelope for all events in the system.
 */
interface EventEnvelope<T = any> {
  /** Unique identifier for the event (UUID) */
  id: string;
  /** ISO 8601 timestamp of when the event occurred */
  timestamp: string;
  /** Version of the event schema for backward compatibility */
  version: string;
  /** Discriminator for the event type */
  type: string;
  /** The specific payload for this event type */
  payload: T;
  /** Contextual identifiers for routing and drill-down */
  metadata: EventMetadata;
}

interface EventMetadata {
  /** Repository UUID if applicable */
  repositoryId?: string;
  /** Session UUID if applicable */
  sessionId?: string;
  /** Task UUID if applicable */
  taskId?: string;
  /** Agent UUID if applicable */
  agentId?: string;
  /** Source of the event (e.g., 'cline', 'manual-import') */
  source?: string;
}
```

## 3. Core Event Types

### 3.1 Telemetry Events (Ingested)

#### `token_usage`
Triggered when token consumption is recorded.
- **Payload**:
  ```typescript
  interface TokenUsagePayload {
    provider: string;      // e.g., 'anthropic'
    model: string;         // e.g., 'claude-3-5-sonnet'
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;         // Calculated cost in USD
  }
  ```

#### `agent_action`
Triggered when an agent performs a tool call or action.
- **Payload**:
  ```typescript
  interface AgentActionPayload {
    action: string;        // e.g., 'tool_call'
    toolName: string;      // e.g., 'read_file'
    input: any;            // The arguments passed to the tool
    output: any;           // The tool's return value
    durationMs: number;    // Time taken for the action
  }
  ```

### 3.2 Lifecycle Events (System/Domain)

#### `repository_detected`
Triggered when a new repository is discovered by a watcher.
- **Payload**:
  ```typescript
  interface RepositoryDetectedPayload {
    name: string;
    path: string;
  }
  ```

#### `session_started` / `session_ended`
Triggered when a work session begins or concludes.
- **Payload**:
  ```typescript
  interface SessionLifecyclePayload {
    sessionId: string;
  }
  ```

#### `task_status_changed`
Triggered when a task transitions between states.
- **Payload**:
  ```typescript
  interface TaskStatusChangedPayload {
    oldStatus: 'pending' | 'running' | 'success' | 'failed' | 'interrupted';
    newStatus: 'pending' | 'running' | 'success' | 'failed' | 'interrupted';
  }
  ```

#### `intervention_occurred`
Triggered when a human intervenes in an agent's workflow.
- **Payload**:
  ```typescript
  interface InterventionPayload {
    description: string;
    impact: 'minor' | 'major' | 'critical';
  }
  ```

### 3.3 Quality & Productivity Events

#### `build_result` / `test_result`
Triggered by CI/CD or local execution monitoring.
- **Payload**:
  ```typescript
  interface QualityResultPayload {
    status: 'success' | 'failure';
    details?: string;      // Error message or summary
    metric?: number;       // e.g., test coverage or duration
  }
  ```

## 4. Propagation Channels

1. **Internal Event Bus (Rust)**: For communication between backend services/modules.
2. **WebSocket Stream (Tauri $\leftrightarrow$ Frontend)**: For real-time UI updates and live activity feeds.
3. **API Response/Polling**: For standard state retrieval.
4. **Stream Deck Bridge (Tauri $\leftrightarrow$ Plugin)**: Optimized stream of high-level metrics for the Stream Deck.