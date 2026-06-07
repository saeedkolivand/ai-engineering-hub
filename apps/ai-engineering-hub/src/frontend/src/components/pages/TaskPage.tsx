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
import { useTasks } from '@/api/hooks';

interface Task {
  id: string;
  session_id: string;
  name: string;
  status: string;
  tokens_used: number | null;
  tokens_saved: number | null;
  interventions: number | null;
  retries: number | null;
  first_pass_success: number | null;
  created_at: string;
}

const columnHelper = createColumnHelper<Task>();

const columns = [
  columnHelper.accessor('name', {
    header: () => <span className="font-semibold text-gray-300">Task</span>,
    cell: (info) => <span className="text-blue-400">{info.getValue()}</span>,
  }),
  columnHelper.accessor('status', {
    header: () => <span className="font-semibold text-gray-300">Status</span>,
    cell: (info) => {
      const s = info.getValue();
      const colors: Record<string, string> = { completed: 'text-green-400', running: 'text-yellow-400', failed: 'text-red-400', pending: 'text-gray-500' };
      return <span className={colors[s] || 'text-gray-400'}>{s}</span>;
    },
  }),
  columnHelper.accessor('tokens_used', {
    header: () => <span className="font-semibold text-gray-300">Tokens</span>,
    cell: (info) => (info.getValue() ?? 0).toLocaleString(),
  }),
  columnHelper.accessor('tokens_saved', {
    header: () => <span className="font-semibold text-gray-300">Saved</span>,
    cell: (info) => <span className="text-green-400">{(info.getValue() ?? 0).toLocaleString()}</span>,
  }),
  columnHelper.accessor('interventions', {
    header: () => <span className="font-semibold text-gray-300">Interventions</span>,
    cell: (info) => info.getValue() ?? 0,
  }),
  columnHelper.accessor('retries', {
    header: () => <span className="font-semibold text-gray-300">Retries</span>,
    cell: (info) => info.getValue() ?? 0,
  }),
  columnHelper.accessor('first_pass_success', {
    header: () => <span className="font-semibold text-gray-300">1st Pass</span>,
    cell: (info) => (info.getValue() ?? 0) > 0 ? '✓' : '—',
  }),
  columnHelper.accessor('created_at', {
    header: () => <span className="font-semibold text-gray-300">Created</span>,
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
];

export const TaskPage: React.FC = () => {
  const { data, isLoading } = useTasks();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const tasks: Task[] = data?.tasks ?? [];

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div className="p-6 text-gray-400">Loading tasks...</div>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-white">Tasks</h1>
      <input
        type="text"
        placeholder="Search tasks..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-64 px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <Card title={`${tasks.length} Tasks`}>
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