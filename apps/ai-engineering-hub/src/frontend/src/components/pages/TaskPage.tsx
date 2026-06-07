import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { Card } from 'shared-ui';

interface Task {
  id: string;
  session_id: string;
  description: string;
  status: string;
  started_at: string;
  completed_at?: string;
}

const columnHelper = createColumnHelper<Task>();

const columns = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('session_id', { header: 'Session ID' }),
  columnHelper.accessor('description', { header: 'Description' }),
  columnHelper.accessor('status', { header: 'Status' }),
  columnHelper.accessor('started_at', { header: 'Started' }),
  columnHelper.accessor('completed_at', { header: 'Completed' }),
];

export const TaskPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['tasks'], async () => {
    const res = await fetch('http://localhost:3000/api/tasks');
    return res.json();
  });

  const tasks: Task[] = data?.tasks ?? [];

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading tasks...</div>;
  if (error) return <div>Error loading tasks.</div>;

  return (
    <Card title="Tasks">
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