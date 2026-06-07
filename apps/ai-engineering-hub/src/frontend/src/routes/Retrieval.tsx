import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { fetchMetrics } from '../../api';
import { Metric } from '@shared-types';

const columnHelper = createColumnHelper<Metric>();

const columns = [
  columnHelper.accessor('id', { header: () => 'ID' }),
  columnHelper.accessor('type', { header: () => 'Type' }),
  columnHelper.accessor('value', { header: () => 'Value' }),
  columnHelper.accessor('unit', { header: () => 'Unit' }),
];

export function Retrieval() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
  });

  const table = useReactTable({
    data: data?.metrics?.filter(m => m.type === 'retrieval') ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div>Loading retrieval metrics…</div>;
  if (error) return <div>Error loading retrieval metrics.</div>;

  return (
    <div>
      <h2>Retrieval Metrics</h2>
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