import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetrics } from '../../api';
import { Metric } from '@shared-types';

export function Quality() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
  });

  if (isLoading) return <div>Loading quality metrics…</div>;
  if (error) return <div>Error loading quality metrics.</div>;

  return (
    <div>
      <h2>Quality Metrics</h2>
      <pre>{JSON.stringify(data?.metrics?.filter(m => m.type === 'quality') ?? [], null, 2)}</pre>
    </div>
  );
}