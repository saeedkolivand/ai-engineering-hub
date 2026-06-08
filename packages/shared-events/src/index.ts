// Shared event contracts. Mirrors packages/shared-events/src/lib.rs (TS↔Rust parity).

/** Optional drill-down hierarchy references attached to an event. */
export interface EntityRefs {
  repository_id?: string;
  session_id?: string;
  task_id?: string;
  agent_id?: string;
}

/**
 * Canonical ingest/transport envelope. Every event self-declares its dynamic
 * `source` (tool key) plus optional hierarchy refs, and carries a typed payload.
 * Accepted by `POST /api/v1/ingest`, the file watcher, and manual import; also
 * broadcast over `/ws/events`.
 */
export interface EventEnvelope<T = Record<string, unknown>> {
  /** Dynamic source/tool key, e.g. "claude-code", "rtk", or any user-defined slug. */
  source: string;
  /** "token_usage" | "savings" | "build_status" | "retrieval" | "intervention" | ... */
  event_type: string;
  /** RFC3339 timestamp. */
  timestamp: string;
  refs?: EntityRefs;
  payload: T;
}

export interface ActivityEvent {
  id: string;
  source: string;
  repository: string;
  task: string;
  agent: string;
  event_type: string;
  timestamp: string;
  token_impact: number;
}

/** Messages broadcast to WebSocket subscribers (hub UI + Stream Deck plugin). */
export type HubEvent =
  | { type: "event"; payload: EventEnvelope }
  | { type: "activity"; payload: ActivityEvent };
