import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { Card } from 'shared-ui';

interface Repository {
  id: string;
  name: string;
  path: string;
  created_at: string;
}

const columnHelper = createColumnHelper<Repository>();

const columns = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('path', { header: 'Path' }),
  columnHelper.accessor('created_at', { header: 'Created' }),
];

export const RepositoryPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['repositories'], async () => {
    const res = await fetch('http://localhost:3000/api/repositories');
    return res.json();
  });

  const repos: Repository[] = data?.repositories ?? [];

  const table = useReactTable({
    data: repos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading repositories...</div>;
  if (error) return <div>Error loading repositories.</div>;

  return (
    <Card title="Repositories">
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};