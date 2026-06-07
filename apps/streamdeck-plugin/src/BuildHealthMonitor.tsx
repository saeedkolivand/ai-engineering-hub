import React from 'react';
import { useMetricUpdates } from './hooks/useMetricUpdates';
import { Metric } from '@shared-types';

/**
 * Displays build‑related health metrics (build success, test success).
 */
export function BuildHealthMonitor() {
  const { data } = useMetricUpdates('build');

  return (
    <div>
      <h4>Build Health Monitor</h4>
      {data?.length ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.map((m: Metric) => (
            <li key={m.id}>
              {m.type}: {m.value}
              {m.unit}
            </li>
          ))}
        </ul>
      ) : (
        <div>No build health data.</div>
      )}
    </div>
  );
}