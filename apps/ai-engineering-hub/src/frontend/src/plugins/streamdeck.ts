/**
 * Stream Deck Plugin entry point.
 * Provides per‑CLI‑agent token usage and savings metrics.
 * Consumes the Hub's WebSocket stream – no direct DB or analytics logic.
 */

import { createConsumer } from '@zsa/streamdeck';
import type { HubEvent } from '@/shared-api-contracts'; // placeholder import

// Define the shape of the metrics we expect per CLI agent
interface AgentMetric {
  agent: string; // e.g., "Claude", "RTK", "Graphify"
  tokensUsed: number;
  tokensSaved: number;
}

// Helper to transform raw HubEvent payload into a normalized array
function normalizeAgentMetrics(payload: Record<string, unknown>): AgentMetric[] {
  // Expected payload shape:
  // {
  //   agents: [
  //     { name: 'Claude', used: 12345, saved: 2345 },
  //     { name: 'RTK', used: 5678, saved: 1023 },
  //     ...
  //   ]
  // }
  const agents = (payload?.agents as unknown) ?? [];
  if (!Array.isArray(agents)) return [];

  return agents.map((a: any) => ({
    agent: a.name ?? 'unknown',
    tokensUsed: Number(a.used ?? 0),
    tokensSaved: Number(a.saved ?? 0),
  }));
}

// Register a consumer that receives live metric updates
export const register = createConsumer({
  // The plugin will listen to a WebSocket endpoint exposed by the Hub
  websocketUrl: 'ws://localhost:3000/ws/metrics',
  onMessage: (event: HubEvent) => {
    // The Hub may emit different event types; we care about 'agentMetrics'
    if (event.type === 'agentMetrics') {
      const metrics = normalizeAgentMetrics(event.payload);
      // Forward the normalized list to the Stream Deck UI
      // The UI can iterate over this array to display per‑agent token usage and savings.
      window.sendToPropertyInspector({ type: 'agentMetrics', metrics });
    } else {
      // Forward any other events unchanged so the UI can handle them if desired
      window.sendToPropertyInspector(event);
    }
  },
});

export default register;