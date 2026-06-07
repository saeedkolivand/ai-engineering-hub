import React from 'react';
import { useMetricUpdates } from './hooks/useMetricUpdates';
import { Metric } from '@shared-types';

/**
 * Lists active agents and their status.
 */
export function AgentMonitor() {
  const { data } = useMetricUpdates('agent');

  return (
    <div>
      <h4>Agent Monitor</h4>
      {data?.length ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.map((m: Metric) => (
            <li key={m.id}>{m.name ?? m.id}: {m.status ?? 'unknown'}</li>
          ))}
        </ul>
      ) : (
        <div>No agents reported.</div>
      )}
    </div>
  );
}