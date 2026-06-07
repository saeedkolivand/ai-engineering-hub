import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from 'shared-ui';

export const AnalyticsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['analytics'], async () => {
    const res = await fetch('http://localhost:3000/api/analytics');
    return res.json();
  });

  if (isLoading) return <div>Loading analytics...</div>;
  if (error) return <div>Error loading analytics.</div>;

  // Placeholder: display raw JSON; replace with tables/charts later
  return (
    <Card title="Analytics">
      <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
};