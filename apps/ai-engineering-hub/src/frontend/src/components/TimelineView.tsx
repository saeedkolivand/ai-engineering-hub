import React from 'react';
import { Metric } from '@shared-types';

/**
 * Placeholder timeline view – in a real app this would render a Gantt‑style
 * visualization of events. Here we simply list metrics ordered by timestamp.
 */
export function TimelineView({ metrics }: { metrics: Metric[] }) {
  const sorted = [...metrics].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  return (
    <div>
      <h3>Timeline</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sorted.map((m) => (
          <li key={m.id}>
            {new Date(m.timestamp ?? 0).toLocaleString()}: {m.type} – {m.value} {m.unit ?? ''}
          </li>
        ))}
        {sorted.length === 0 && <li>No timeline data.</li>}
      </ul>
    </div>
  );
}