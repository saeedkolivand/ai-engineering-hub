import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/react-table';
import { Card } from 'shared-ui';

interface Task {
  id: string;
  session_id: string;
  description: string;
  status: string;
  started_at?: string;
  completed_at?: string;
}

export const TaskPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['tasks'], async () => {
    const res = await fetch('http://localhost:3000/api/tasks');
    return res.json();
  });

  const columns = React.useMemo<ColumnDef<Task, any>[]>(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'session_id', header: 'Session ID' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'started_at', header: 'Started' },
    { accessorKey: 'completed_at', header: 'Completed' },
  ], []);

  if (isLoading) return <div>Loading tasks...</div>;
  if (error) return <div>Error loading tasks.</div>;

  return (
    <Card title="Tasks">
      <Table data={data.tasks ?? []} columns={columns} />
    </Card>
  );
};