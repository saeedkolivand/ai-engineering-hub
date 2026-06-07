import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/react-table';
import { Card } from 'shared-ui';

interface Session {
  id: string;
  repository_id: string;
  start_time: string;
  end_time?: string;
  status: string;
}

export const SessionPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['sessions'], async () => {
    const res = await fetch('http://localhost:3000/api/sessions');
    return res.json();
  });

  const columns = React.useMemo<ColumnDef<Session, any>[]>(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'repository_id', header: 'Repo ID' },
    { accessorKey: 'start_time', header: 'Started' },
    { accessorKey: 'end_time', header: 'Ended' },
    { accessorKey: 'status', header: 'Status' },
  ], []);

  if (isLoading) return <div>Loading sessions...</div>;
  if (error) return <div>Error loading sessions.</div>;

  return (
    <Card title="Sessions">
      <Table data={data.sessions ?? []} columns={columns} />
    </Card>
  );
};