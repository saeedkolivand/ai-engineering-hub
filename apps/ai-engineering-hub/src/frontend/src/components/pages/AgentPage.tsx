import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/react-table';
import { Card } from 'shared-ui';

interface Agent {
  id: string;
  name: string;
  provider: string;
  model_id: string;
}

export const AgentPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['agents'], async () => {
    const res = await fetch('http://localhost:3000/api/agents');
    return res.json();
  });

  const columns = React.useMemo<ColumnDef<Agent, any>[]>(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'provider', header: 'Provider' },
    { accessorKey: 'model_id', header: 'Model ID' },
  ], []);

  if (isLoading) return <div>Loading agents...</div>;
  if (error) return <div>Error loading agents.</div>;

  return (
    <Card title="Agents">
      <Table data={data.agents ?? []} columns={columns} />
    </Card>
  );
};