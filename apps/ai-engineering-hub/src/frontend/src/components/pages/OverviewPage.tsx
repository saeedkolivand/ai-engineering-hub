import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { Card } from 'shared-ui';
import { useRepositories, useSessions, useTasks, useAgents, useAnalytics } from '@/api/hooks';

interface Task {
  id: string;
  name: string;
  session_id: string;
  status: string;
  tokens_used: number | null;
  tokens_saved: number | null;
  interventions: number | null;
  retries: number | null;
  created_at: string;
}

const columnHelper = createColumnHelper<Task>();

const columns = [
  columnHelper.accessor('name', {
    header: () => <span className="font-semibold text-gray-300">Task</span>,
    cell: (info) => (
      <a href={`/tasks/${info.row.original.id}`} className="text-blue-400 hover:text-blue-300">
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor('status', {
    header: () => <span className="font-semibold text-gray-300">Status</span>,
    cell: (info) => {
      const status = info.getValue();
      const colorMap: Record<string, string> = {
        completed: 'text-green-400',
        running: 'text-yellow-400',
        failed: 'text-red-400',
        pending: 'text-gray-500',
      };
      return <span className={colorMap[status] || 'text-gray-400'}>{status}</span>;
    },
  }),
  columnHelper.accessor('tokens_used', {
    header: () => <span className="font-semibold text-gray-300">Tokens</span>,
    cell: (info) => (info.getValue() ?? 0).toLocaleString(),
  }),
  columnHelper.accessor('interventions', {
    header: () => <span className="font-semibold text-gray-300">Interventions</span>,
    cell: (info) => info.getValue() ?? 0,
  }),
  columnHelper.accessor('created_at', {
    header: () => <span className="font-semibold text-gray-300">Created</span>,
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
];

export const OverviewPage: React.FC = () => {
  const { data: reposData } = useRepositories();
  const { data: sessionsData } = useSessions();
  const { data: tasksData } = useTasks();
  const { data: agentsData } = useAgents();
  const { data: analyticsData } = useAnalytics();

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const tasks: Task[] = tasksData?.tasks ?? [];
  const reps = reposData?.repositories ?? [];
  const sessions = sessionsData?.sessions ?? [];
  const agents = agentsData?.agents ?? [];
  const tokenMetrics = analyticsData?.token_metrics ?? { daily: 0, weekly: 0, monthly: 0 };
  const savings = analyticsData?.savings ?? { total: 0 };

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-white">Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Repositories">
          <span className="text-3xl font-bold text-white">{reps.length}</span>
        </Card>
        <Card title="Sessions">
          <span className="text-3xl font-bold text-white">{sessions.length}</span>
        </Card>
        <Card title="Tasks">
          <span className="text-3xl font-bold text-white">{tasks.length}</span>
        </Card>
        <Card title="Agents">
          <span className="text-3xl font-bold text-white">{agents.length}</span>
        </Card>
      </div>

      {/* Token Usage */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="Tokens Today">
          <span className="text-2xl font-bold text-blue-400">{tokenMetrics.daily.toLocaleString()}</span>
        </Card>
        <Card title="Tokens This Week">
          <span className="text-2xl font-bold text-yellow-400">{tokenMetrics.weekly.toLocaleString()}</span>
        </Card>
        <Card title="Tokens This Month">
          <span className="text-2xl font-bold text-green-400">{tokenMetrics.monthly.toLocaleString()}</span>
        </Card>
      </div>

      {/* Savings */}
      <Card title="Total Savings">
        <span className="text-2xl font-bold text-emerald-400">{savings.total.toLocaleString()} tokens</span>
      </Card>

      {/* Tasks Table */}
      <Card title="Recent Tasks">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2 text-left cursor-pointer hover:text-white"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? null}
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