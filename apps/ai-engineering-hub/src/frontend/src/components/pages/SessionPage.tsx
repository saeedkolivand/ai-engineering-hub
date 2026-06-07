import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { Card } from 'shared-ui';

interface Session {
  id: string;
  repository_id: string;
  start_time: string;
  end_time?: string;
  status: string;
}

const columnHelper = createColumnHelper<Session>();

const columns = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('repository_id', { header: 'Repo ID' }),
  columnHelper.accessor('start_time', { header: 'Started' }),
  columnHelper.accessor('end_time', { header: 'Ended' }),
  columnHelper.accessor('status', { header: 'Status' }),
];

export const SessionPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['sessions'], async () => {
    const res = await fetch('http://localhost:3000/api/sessions');
    return res.json();
  });

  const sessions: Session[] = data?.sessions ?? [];

  const table = useReactTable({
    data: sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading sessions...</div>;
  if (error) return <div>Error loading sessions.</div>;

  return (
    <Card title="Sessions">
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