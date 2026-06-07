import { useEffect, useState } from 'react';
import { EventEnvelope, MetricUpdatePayload } from '@shared-events';
import { apiClient } from '@shared-api-contracts/client';

export function useMetricUpdates() {
  const [token, setToken] = useState<MetricUpdatePayload | null>(null);

  useEffect(() => {
    // Connect to WebSocket exposed by the main app
    const ws = new WebSocket('ws://127.0.0.1:0/ws/events'); // placeholder port
    ws.onmessage = (event) => {
      try {
        const envelope: EventEnvelope<MetricUpdatePayload> = JSON.parse(event.data);
        if (envelope.type === 'metric.update') {
          setToken(envelope.payload);
        }
      } catch {
        // ignore malformed messages
      }
    };
    return () => ws.close();
  }, []);

  return { token };
}