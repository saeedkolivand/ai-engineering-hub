/**
 * Minimal API contract layer used by the frontend.
 * In a real implementation these would call the backend Axum REST endpoints.
 */

export interface Task {
  id: string;
  name: string;
  status: string;
}

export interface Agent {
  id: string;
  name: string;
  status: string;
}

export interface Metric {
  id: string;
  type: string;
  value: number | string;
  unit?: string;
  timestamp?: number;
}

/**
 * Fetch list of tasks.
 */
export async function fetchTasks(): Promise<Task[]> {
  const resp = await fetch('/api/v1/tasks');
  if (!resp.ok) throw new Error('Failed to fetch tasks');
  return resp.json();
}

/**
 * Fetch list of agents.
 */
export async function fetchAgents(): Promise<Agent[]> {
  const resp = await fetch('/api/v1/agents');
  if (!resp.ok) throw new Error('Failed to fetch agents');
  return resp.json();
}

/**
 * Fetch generic metrics (used by Stream Deck monitors).
 */
export async function fetchMetrics(category: string): Promise<Metric[]> {
  const resp = await fetch(`/api/v1/metrics?category=${encodeURIComponent(category)}`);
  if (!resp.ok) throw new Error('Failed to fetch metrics');
  return resp.json();
}