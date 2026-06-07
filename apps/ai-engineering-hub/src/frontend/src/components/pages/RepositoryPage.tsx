import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/react-table';
import { Card } from '@/components/ui/Card';

interface Repository {
  id: string;
  name: string;
  path: string;
  created_at: string;
}

export const RepositoryPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['repositories'], async () => {
    const res = await fetch('http://localhost:3000/api/repositories');
    return res.json();
  });

  const columns = React.useMemo<ColumnDef<Repository, any>[]>(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'path', header: 'Path' },
    { accessorKey: 'created_at', header: 'Created' },
  ], []);

  if (isLoading) return <div>Loading repositories...</div>;
  if (error) return <div>Error loading repositories.</div>;

  return (
    <Card title="Repositories">
      <Table data={data.repositories} columns={columns} />
    </Card>
  );
};