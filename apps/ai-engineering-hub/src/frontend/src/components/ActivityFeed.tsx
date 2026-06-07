import React, { useEffect, useState } from 'react';
import { EventEnvelope } from '../../../../../packages/shared-events/src';

/**
 * Very light activity feed that connects to the backend WebSocket
 * and displays the last few events.
 */
export function ActivityFeed() {
  const [events, setEvents] = useState<EventEnvelope<unknown>[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:0/ws/events'); // placeholder port
    ws.onmessage = (msg) => {
      try {
        const envelope: EventEnvelope<unknown> = JSON.parse(msg.data);
        setEvents((prev) => [...prev.slice(-9), envelope]); // keep last 10
      } catch {
        // ignore malformed data
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div>
      <h3>Activity Feed</h3>
      <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
        {events.map((e, i) => (
          <li key={i} style={{ marginBottom: '0.3rem' }}>
            [{e.timestamp}] {e.type}
          </li>
        ))}
        {events.length === 0 && <li>No activity yet.</li>}
      </ul>
    </div>
  );
}