import React from 'react';
import type { MetricUpdatePayload } from '@shared-events';

export function TokenMonitor({ data }: { data: MetricUpdatePayload | null }) {
  if (!data) return <div>No token data yet</div>;

  return (
    <div>
      <h3>Token Usage</h3>
      <p>Repository: {data.repositoryId}</p>
      <p>Metric ID: {data.metric.id}</p>
      <p>Value: {data.metric.value} {data.metric.unit ?? ''}</p>
    </div>
  );
}