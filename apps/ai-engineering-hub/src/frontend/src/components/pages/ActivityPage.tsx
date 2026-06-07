import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from 'shared-ui';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  type: string;
  repository: string;
  task: string;
  agent: string;
  timestamp: string;
  details: string;
}

export const ActivityPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['activity'], async () => {
    const res = await fetch('http://localhost:3000/api/activity');
    return res.json();
  });

  if (isLoading) return <div>Loading activity…</div>;
  if (error) return <div>Error loading activity.</div>;

  const events: ActivityEvent[] = data?.events ?? [];

  return (
    <Card title="Activity Feed">
      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.id} className="p-2 border rounded bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{e.type} – {e.repository}</span>
              <span title={e.timestamp}>
                {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
              </span>
            </div>
            <div className="mt-1 text-sm">
              <strong>Task:</strong> {e.task} &nbsp;|&nbsp; <strong>Agent:</strong> {e.agent}
            </div>
            {e.details && <p className="mt-1 text-xs text-gray-500">{e.details}</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
};