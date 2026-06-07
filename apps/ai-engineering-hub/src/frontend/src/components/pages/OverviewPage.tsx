import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';

export const OverviewPage: React.FC = () => {
  // Placeholder query – replace with real API call
  const { data, isLoading } = useQuery(['overview'], async () => {
    const res = await fetch('http://localhost:3000/api/health');
    return res.json();
  });

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card title="System Health">
          {isLoading ? 'Loading...' : JSON.stringify(data)}
        </Card>
        {/* Additional summary cards can be added here */}
      </div>
    </div>
  );
};