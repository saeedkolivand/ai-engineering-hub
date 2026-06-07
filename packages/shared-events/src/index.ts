export type EventEnvelope<T = unknown> = {
  /** The type identifier for the event, e.g. "metric.update" */
  type: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Payload data – strongly typed per event */
  payload: T;
};

/** Example concrete event payloads */
export interface MetricUpdatePayload {
  repositoryId: string;
  sessionId?: string;
  taskId?: string;
  metric: {
    id: string;
    event_type: string;
    value: number;
    unit?: string;
  };
}

/** Additional event types can be added here */
export interface AgentStatusPayload {
  agentId: string;
  status: "online" | "offline" | "error";
  details?: string;
}