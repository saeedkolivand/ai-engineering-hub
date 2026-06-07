import React from 'react';
import { useMetricUpdates } from './hooks/useMetricUpdates';
import { Metric } from '@shared-types';

/**
 * Shows retrieval KPIs such as accuracy and latency.
 */
export function RetrievalMonitor() {
  const { data } = useMetricUpdates('retrieval');

  return (
    <div>
      <h4>Retrieval Monitor</h4>
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
        <div>No retrieval data.</div>
      )}
    </div>
  );
}