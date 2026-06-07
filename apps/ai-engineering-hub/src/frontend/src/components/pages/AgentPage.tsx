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
import { useAgents } from '@/api/hooks';

interface Agent {
  id: string;
  name: string;
  provider: string;
  model_id: string | null;
  created_at: string;
}

const columnHelper = createColumnHelper<Agent>();

const columns = [
  columnHelper.accessor('name', {
    header: () => <span className="font-semibold text-gray-300">Name</span>,
    cell: (info) => <span className="text-blue-400 font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('provider', {
    header: () => <span className="font-semibold text-gray-300">Provider</span>,
    cell: (info) => <span className="text-gray-300">{info.getValue()}</span>,
  }),
  columnHelper.accessor('model_id', {
    header: () => <span className="font-semibold text-gray-300">Model</span>,
    cell: (info) => info.getValue() ?? <span className="text-gray-600">—</span>,
  }),
  columnHelper.accessor('created_at', {
    header: () => <span className="font-semibold text-gray-300">Added</span>,
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

export const AgentPage: React.FC = () => {
  const { data, isLoading } = useAgents();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const agents: Agent[] = data?.agents ?? [];

  const table = useReactTable({
    data: agents,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div className="p-6 text-gray-400">Loading agents...</div>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-white">Agents</h1>
      <input
        type="text"
        placeholder="Search agents..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-64 px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <Card title={`${agents.length} Agents`}>
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