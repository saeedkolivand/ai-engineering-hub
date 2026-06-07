import React from 'react';
import { useMetricUpdates } from './hooks/useMetricUpdates';
import { Metric } from '@shared-types';

/**
 * Shows productivity KPIs such as first‑pass success and retry rate.
 */
export function ProductivityMonitor() {
  const { data } = useMetricUpdates('productivity');

  return (
    <div>
      <h4>Productivity Monitor</h4>
      {data?.length ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.map((m: Metric) => (
            <li key={m.id}>
              {m.name ?? m.type}: {m.value}
              {m.unit}
            </li>
          ))}
        </ul>
      ) : (
        <div>No productivity data.</div>
      )}
    </div>
  );
}