import React, { useEffect, useState } from 'react';
import { useMetricUpdates } from './hooks/useMetricUpdates';
import { Metric } from '@shared-types';

/**
 * Shows aggregated savings (e.g., RTK, Graphify, CodeGraph).
 */
export function SavingsMonitor() {
  const { data } = useMetricUpdates('savings');
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const sum = data?.reduce((acc, cur) => acc + Number(cur.value), 0) ?? 0;
    setTotal(sum);
  }, [data]);

  return (
    <div>
      <h4>Savings Monitor</h4>
      <div>Total Savings: {total}</div>
    </div>
  );
}