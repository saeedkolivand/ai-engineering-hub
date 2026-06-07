import React from 'react';
import { useMetricUpdates } from './hooks/useMetricUpdates';
import { Metric } from '@shared-types';

/**
 * Shows task‑level metrics such as status and token impact.
 */
export function TaskMonitor() {
  const { data } = useMetricUpdates('task');

  return (
    <div>
      <h4>Task Monitor</h4>
      {data?.length ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.map((m: Metric) => (
            <li key={m.id}>
              {m.name ?? m.id} – {m.status ?? 'unknown'} ({m.value}
              {m.unit})
            </li>
          ))}
        </ul>
      ) : (
        <div>No task data.</div>
      )}
    </div>
  );
}