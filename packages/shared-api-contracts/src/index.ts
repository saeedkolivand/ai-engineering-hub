// Request/response contracts for every Hub HTTP endpoint. Single source of truth
// for the hub frontend and the Stream Deck SDK. Mirrors core/src/server.rs routes.
import type {
  Agent,
  AnalyticsMetrics,
  Intelligence,
  Repository,
  Session,
  Source,
  Task,
} from "@shared-types";
import type { EventEnvelope } from "@shared-events";

/** Base path for the versioned REST API. */
export const API_BASE = "/api/v1";
/** WebSocket path for the live event stream. */
export const WS_PATH = "/ws/events";

export interface ListSessionsQuery {
  repository_id?: string;
}
export interface ListTasksQuery {
  session_id?: string;
}

/** GET endpoints -> response bodies (arrays returned directly, not wrapped). */
export interface HubApi {
  "GET /health": string;
  "GET /api/v1/repositories": Repository[];
  "GET /api/v1/repositories/:id": Repository;
  "GET /api/v1/sessions": Session[];
  "GET /api/v1/tasks": Task[];
  "GET /api/v1/agents": Agent[];
  "GET /api/v1/sources": Source[];
  "GET /api/v1/analytics": AnalyticsMetrics;
  "GET /api/v1/intelligence": Intelligence;
}

/** POST /api/v1/sources/:id/enabled */
export interface SetSourceEnabledRequest {
  enabled: boolean;
}
export interface SetSourceEnabledResponse {
  ok: boolean;
}

/** POST /api/v1/ingest — accepts a single envelope or a batch. */
export type IngestRequest = EventEnvelope | EventEnvelope[];
export interface IngestResponse {
  ingested: number;
}

export type {
  Agent,
  AnalyticsMetrics,
  Intelligence,
  Repository,
  Session,
  Source,
  Task,
} from "@shared-types";
export type { EventEnvelope, HubEvent, ActivityEvent } from "@shared-events";
