import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { fetchTasks } from '../../api';
import { Task } from '@shared-types';

const columnHelper = createColumnHelper<Task>();

const columns = [
  columnHelper.accessor('id', { header: () => 'ID' }),
  columnHelper.accessor('session_id', { header: () => 'Session' }),
  columnHelper.accessor('name', { header: () => 'Name' }),
  columnHelper.accessor('status', { header: () => 'Status' }),
];

export function Tasks() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const table = useReactTable({
    data: data?.tasks ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div>Loading tasks…</div>;
  if (error) return <div>Error loading tasks.</div>;

  return (
    <div>
      <h2>Tasks</h2>
      <table>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}