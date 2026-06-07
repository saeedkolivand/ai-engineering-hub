import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { fetchSessions } from '../../api';
import { Session } from '@shared-types';

const columnHelper = createColumnHelper<Session>();

const columns = [
  columnHelper.accessor('id', { header: () => 'ID' }),
  columnHelper.accessor('repository_id', { header: () => 'Repository' }),
  columnHelper.accessor('started_at', { header: () => 'Started At' }),
  columnHelper.accessor('ended_at', { header: () => 'Ended At' }),
];

export function Sessions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  });

  const table = useReactTable({
    data: data?.sessions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div>Loading sessions…</div>;
  if (error) return <div>Error loading sessions.</div>;

  return (
    <div>
      <h2>Sessions</h2>
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
    </div>
  );
}