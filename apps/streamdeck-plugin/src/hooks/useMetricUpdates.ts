import { useEffect, useState } from 'react';
import { Metric } from '@shared-types';

/**
 * Simple hook that opens a WebSocket to the Hub and streams metrics
 * filtered by `category`. The backend already emits events that contain
 * a `category` field (e.g., "token", "savings", "agent", ...).
 */
export function useMetricUpdates(category: string) {
  const [data, setData] = useState<Metric[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:0/ws/events'); // placeholder
    ws.onmessage = (msg) => {
      try {
        const envelope = JSON.parse(msg.data);
        if (envelope?.payload?.category === category) {
          setData((prev) => [...prev, envelope.payload as Metric]);
        }
      } catch {
        // ignore malformed messages
      }
    };
    return () => ws.close();
  }, [category]);

  return { data };
}