import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetrics } from '../../api';
import { Metric } from '@shared-types';

export function Analytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
  });

  if (isLoading) return <div>Loading analytics…</div>;
  if (error) return <div>Error loading analytics.</div>;

  return (
    <div>
      <h2>Analytics Overview</h2>
      <pre>{JSON.stringify(data?.metrics ?? [], null, 2)}</pre>
    </div>
  );
}