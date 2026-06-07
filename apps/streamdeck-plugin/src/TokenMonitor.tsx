import React, { useEffect, useState } from 'react';
import { useMetricUpdates } from './hooks/useMetricUpdates';
import { Metric } from '@shared-types';

/**
 * Displays the latest token usage metric.
 */
export function TokenMonitor() {
  const { data } = useMetricUpdates('token');
  const [latest, setLatest] = useState<Metric | null>(null);

  useEffect(() => {
    if (data?.length) {
      setLatest(data[data.length - 1]);
    }
  }, [data]);

  return (
    <div>
      <h4>Token Monitor</h4>
      {latest ? (
        <div>
          {new Date(latest.timestamp ?? 0).toLocaleTimeString()}: {latest.value}{' '}
          {latest.unit}
        </div>
      ) : (
        <div>No data yet.</div>
      )}
    </div>
  );
}