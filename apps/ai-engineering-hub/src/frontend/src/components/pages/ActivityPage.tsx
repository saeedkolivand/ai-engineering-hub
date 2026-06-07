import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from 'shared-ui';

export const ActivityPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['activity'], async () => {
    const res = await fetch('http://localhost:3000/api/activity');
    return res.json();
  });

  if (isLoading) return <div>Loading activity...</div>;
  if (error) return <div>Error loading activity.</div>;

  return (
    <Card title="Activity Feed">
      <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
};