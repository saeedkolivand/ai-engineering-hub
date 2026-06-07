import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { Card } from 'shared-ui';
import { useRepositories } from '@/api/hooks';

interface Repository {
  id: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
}

const columnHelper = createColumnHelper<Repository>();

const columns = [
  columnHelper.accessor('name', {
    header: () => <span className="font-semibold text-gray-300">Name</span>,
    cell: (info) => (
      <a href={`/repositories/${info.row.original.id}`} className="text-blue-400 hover:text-blue-300">
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor('path', {
    header: () => <span className="font-semibold text-gray-300">Path</span>,
    cell: (info) => <code className="text-xs text-gray-400">{info.getValue()}</code>,
  }),
  columnHelper.accessor('created_at', {
    header: () => <span className="font-semibold text-gray-300">Created</span>,
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor('updated_at', {
    header: () => <span className="font-semibold text-gray-300">Updated</span>,
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

export const RepositoryPage: React.FC = () => {
  const { data, isLoading } = useRepositories();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const repos: Repository[] = data?.repositories ?? [];

  const table = useReactTable({
    data: repos,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div className="p-6 text-gray-400">Loading repositories...</div>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-white">Repositories</h1>
      <input
        type="text"
        placeholder="Search repositories..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-64 px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <Card title={`${repos.length} Repositories`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="px-4 py-2 text-left cursor-pointer hover:text-white"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};