import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { fetchRepositories } from '../../api';
import { Repository } from '@shared-types';

const columnHelper = createColumnHelper<Repository>();

const columns = [
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('path', { header: 'Path' }),
  columnHelper.accessor('created_at', { header: 'Created At' })
];

export function Repositories() {
  const { data, isLoading, error } = useQuery(['repositories'], fetchRepositories);

  const table = useReactTable({
    data: data?.repositories ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading repositories…</div>;
  if (error) return <div>Error loading repositories.</div>;

  return (
    <div>
      <h2>Repositories</h2>
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>{header.isPlaceholder ? null : header.renderHeader()}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>{cell.renderCell()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}