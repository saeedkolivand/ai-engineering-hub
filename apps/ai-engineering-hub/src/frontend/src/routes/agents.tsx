import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { fetchAgents } from '../../api';
import { Agent } from '@shared-types';

const columnHelper = createColumnHelper<Agent>();

const columns = [
  columnHelper.accessor('id', { header: () => 'ID' }),
  columnHelper.accessor('name', { header: () => 'Name' }),
  columnHelper.accessor('type', { header: () => 'Type' }),
];

export function Agents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  });

  const table = useReactTable({
    data: data?.agents ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div>Loading agents…</div>;
  if (error) return <div>Error loading agents.</div>;

  return (
    <div>
      <h2>Agents</h2>
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