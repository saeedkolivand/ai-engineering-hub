import React from 'react';
import { useMetricUpdates } from './hooks/useMetricUpdates';
import { Metric } from '@shared-types';

/**
 * Displays recent interventions and their token impact.
 */
export function InterventionMonitor() {
  const { data } = useMetricUpdates('intervention');

  return (
    <div>
      <h4>Intervention Monitor</h4>
      {data?.length ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.map((m: Metric) => (
            <li key={m.id}>
              {new Date(m.timestamp ?? 0).toLocaleTimeString()}: {m.type} –{' '}
              {m.value}
              {m.unit}
            </li>
          ))}
        </ul>
      ) : (
        <div>No interventions recorded.</div>
      )}
    </div>
  );
}