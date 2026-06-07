import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { Card } from 'shared-ui';

interface Agent {
  id: string;
  name: string;
  provider: string;
  model_id: string;
}

const columnHelper = createColumnHelper<Agent>();

const columns = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('provider', { header: 'Provider' }),
  columnHelper.accessor('model_id', { header: 'Model ID' }),
];

export const AgentPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['agents'], async () => {
    const res = await fetch('http://localhost:3000/api/agents');
    return res.json();
  });

  const agents: Agent[] = data?.agents ?? [];

  const table = useReactTable({
    data: agents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading agents...</div>;
  if (error) return <div>Error loading agents.</div>;

  return (
    <Card title="Agents">
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