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
import { useSessions } from '@/api/hooks';

interface Session {
  id: string;
  repository_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

const columnHelper = createColumnHelper<Session>();

const columns = [
  columnHelper.accessor('id', {
    header: () => <span className="font-semibold text-gray-300">ID</span>,
    cell: (info) => <code className="text-xs text-gray-400">{info.getValue().slice(0, 8)}...</code>,
  }),
  columnHelper.accessor('status', {
    header: () => <span className="font-semibold text-gray-300">Status</span>,
    cell: (info) => {
      const s = info.getValue();
      const colors: Record<string, string> = { running: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' };
      return <span className={colors[s] || 'text-gray-400'}>{s}</span>;
    },
  }),
  columnHelper.accessor('started_at', {
    header: () => <span className="font-semibold text-gray-300">Started</span>,
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor('ended_at', {
    header: () => <span className="font-semibold text-gray-300">Ended</span>,
    cell: (info) => (info.getValue() ? new Date(info.getValue()).toLocaleString() : '—'),
  }),
  columnHelper.accessor('repository_id', {
    header: () => <span className="font-semibold text-gray-300">Repository</span>,
    cell: (info) => <code className="text-xs text-gray-400">{info.getValue().slice(0, 8)}...</code>,
  }),
];

export const SessionPage: React.FC = () => {
  const { data, isLoading } = useSessions();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const sessions: Session[] = data?.sessions ?? [];

  const table = useReactTable({
    data: sessions,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div className="p-6 text-gray-400">Loading sessions...</div>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-white">Sessions</h1>
      <input
        type="text"
        placeholder="Search sessions..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-64 px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <Card title={`${sessions.length} Sessions`}>
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