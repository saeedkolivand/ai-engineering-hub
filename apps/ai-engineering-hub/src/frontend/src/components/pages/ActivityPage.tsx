import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from 'shared-ui';
import { formatDistanceToNow } from 'date-fns';

interface AgentMetricsMessage {
  type: 'agentMetrics';
  metrics: Array<{
    agent: string;
    tokensUsed: number;
    tokensSaved: number;
  }>;
}

interface ActivityEntry {
  id: string;
  timestamp: Date;
  type: string;
  repository?: string;
  task?: string;
  agent?: string;
  event: string;
  tokensUsed?: number;
  tokensSaved?: number;
  details?: string;
}

const WS_URL = 'ws://localhost:3000/ws/metrics';
const MAX_EVENTS = 500;

const AGENT_COLORS: Record<string, string> = {
  Claude: 'text-purple-400',
  OpenCode: 'text-blue-400',
  Cline: 'text-green-400',
  'Gemini CLI': 'text-yellow-400',
  RTK: 'text-red-400',
  Graphify: 'text-pink-400',
  CodeGraph: 'text-cyan-400',
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const ActivityPage: React.FC = () => {
  const [events, setEvents] = useState<ActivityEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [metricsSummary, setMetricsSummary] = useState<Record<string, { used: number; saved: number }>>({});
  const parentRef = useRef<HTMLDivElement>(null);

  const addEvent = useCallback((entry: ActivityEntry) => {
    setEvents((prev) => [entry, ...prev].slice(0, MAX_EVENTS));
  }, []);

  // WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onmessage = (msg) => {
        try {
          const data: AgentMetricsMessage = JSON.parse(msg.data);
          if (data.type === 'agentMetrics') {
            const timestamp = new Date();
            const summary: Record<string, { used: number; saved: number }> = {};

            data.metrics.forEach((m) => {
              summary[m.agent] = { used: m.tokensUsed, saved: m.tokensSaved };

              addEvent({
                id: generateId(),
                timestamp,
                type: 'token_update',
                agent: m.agent,
                event: `tokens used: ${m.tokensUsed.toLocaleString()}, saved: ${m.tokensSaved.toLocaleString()}`,
                tokensUsed: m.tokensUsed,
                tokensSaved: m.tokensSaved,
                details: `Agent ${m.agent} reported token metrics`,
              });
            });

            setMetricsSummary((prev) => ({ ...prev, ...summary }));
          }
        } catch {
          // ignore parse errors
        }
      };
    }

    connect();
    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, [addEvent]);

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Activity</h1>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">{connected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Agent Metrics Summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(metricsSummary).map(([agent, metrics]) => (
          <Card key={agent} title={agent}>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Used</span>
                <span className="font-mono text-white">{metrics.used.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Saved</span>
                <span className="font-mono text-green-400">{metrics.saved.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Activity Feed */}
      <Card title="Live Feed" className="flex-1 min-h-0">
        <div ref={parentRef} className="h-[600px] overflow-y-auto">
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const event = events[virtualItem.index];
              return (
                <div
                  key={event.id}
                  className="absolute left-0 right-0 px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {event.agent && (
                        <span className={`text-xs font-semibold ${AGENT_COLORS[event.agent] || 'text-gray-400'}`}>
                          {event.agent}
                        </span>
                      )}
                      <span className="text-sm text-gray-300">{event.event}</span>
                    </div>
                    <span className="text-xs text-gray-500" title={event.timestamp.toISOString()}>
                      {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  {event.details && (
                    <p className="mt-1 text-xs text-gray-600">{event.details}</p>
                  )}
                  <div className="flex gap-3 mt-1">
                    {event.tokensUsed !== undefined && (
                      <span className="text-xs text-gray-500">
                        Tokens: <span className="text-blue-400">{event.tokensUsed.toLocaleString()}</span>
                      </span>
                    )}
                    {event.tokensSaved !== undefined && event.tokensSaved > 0 && (
                      <span className="text-xs text-gray-500">
                        Saved: <span className="text-green-400">{event.tokensSaved.toLocaleString()}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};