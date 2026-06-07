import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetrics } from '../../api';
import { Metric } from '@shared-types';

export function Activity() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
  });

  if (isLoading) return <div>Loading activity…</div>;
  if (error) return <div>Error loading activity.</div>;

  return (
    <div>
      <h2>Activity Feed</h2>
      <pre>{JSON.stringify(data?.metrics?.filter(m => m.type === 'activity') ?? [], null, 2)}</pre>
    </div>
  );
}