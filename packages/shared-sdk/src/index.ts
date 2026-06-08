// Typed client over the Hub HTTP/WS API. Single way for the Stream Deck plugin
// (and any external tool) to consume the Hub — no inlined fetch shapes.
import {
  API_BASE,
  WS_PATH,
  type IngestRequest,
  type IngestResponse,
  type SetSourceEnabledResponse,
} from "shared-api-contracts";
import type {
  Agent,
  AnalyticsMetrics,
  Intelligence,
  Repository,
  Session,
  Source,
  Task,
} from "shared-types";
import type { EventEnvelope, HubEvent } from "shared-events";

export const DEFAULT_HUB_PORT = 47800;

export interface HubClientOptions {
  /** Host:port base, defaults to 127.0.0.1:47800. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class HubClient {
  private readonly base: string;
  private readonly wsBase: string;
  private readonly doFetch: typeof fetch;

  constructor(opts: HubClientOptions = {}) {
    const base = opts.baseUrl ?? `http://127.0.0.1:${DEFAULT_HUB_PORT}`;
    this.base = base.replace(/\/$/, "");
    this.wsBase = this.base.replace(/^http/, "ws");
    this.doFetch = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.doFetch(`${this.base}${path}`);
    if (!res.ok) throw new Error(`Hub GET ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.doFetch(`${this.base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Hub POST ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }

  health = () => this.get<string>("/health");
  repositories = () => this.get<Repository[]>(`${API_BASE}/repositories`);
  repository = (id: string) => this.get<Repository>(`${API_BASE}/repositories/${id}`);
  sessions = (repositoryId?: string) =>
    this.get<Session[]>(`${API_BASE}/sessions${repositoryId ? `?repository_id=${encodeURIComponent(repositoryId)}` : ""}`);
  tasks = (sessionId?: string) =>
    this.get<Task[]>(`${API_BASE}/tasks${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`);
  agents = () => this.get<Agent[]>(`${API_BASE}/agents`);
  sources = () => this.get<Source[]>(`${API_BASE}/sources`);
  analytics = () => this.get<AnalyticsMetrics>(`${API_BASE}/analytics`);
  intelligence = () => this.get<Intelligence>(`${API_BASE}/intelligence`);

  setSourceEnabled = (id: string, enabled: boolean) =>
    this.post<SetSourceEnabledResponse>(`${API_BASE}/sources/${id}/enabled`, { enabled });

  ingest = (events: IngestRequest) => this.post<IngestResponse>(`${API_BASE}/ingest`, events);

  /** Subscribe to the live event stream. Returns the WebSocket so callers can close it. */
  connect(onEvent: (event: HubEvent) => void, onError?: (e: Event) => void): WebSocket {
    const ws = new WebSocket(`${this.wsBase}${WS_PATH}`);
    ws.onmessage = (msg) => {
      try {
        onEvent(JSON.parse(msg.data as string) as HubEvent);
      } catch {
        /* ignore malformed frames */
      }
    };
    if (onError) ws.onerror = onError;
    return ws;
  }
}

export type { EventEnvelope, HubEvent };
