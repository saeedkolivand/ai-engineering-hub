import React from 'react';
import { Card } from 'shared-ui';
import { useAnalytics } from '@/api/hooks';

export const AnalyticsPage: React.FC = () => {
  const { data, isLoading } = useAnalytics();

  if (isLoading) return <div className="p-6 text-gray-400">Loading analytics...</div>;

  const tokenMetrics = data?.token_metrics ?? { daily: 0, weekly: 0, monthly: 0 };
  const savings = data?.savings ?? { total: 0 };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Token Usage Summary */}
      <Card title="Token Usage">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800/50 rounded">
            <div className="text-sm text-gray-400 mb-1">Today</div>
            <div className="text-2xl font-bold text-blue-400">{tokenMetrics.daily.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded">
            <div className="text-sm text-gray-400 mb-1">This Week</div>
            <div className="text-2xl font-bold text-yellow-400">{tokenMetrics.weekly.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded">
            <div className="text-sm text-gray-400 mb-1">This Month</div>
            <div className="text-2xl font-bold text-green-400">{tokenMetrics.monthly.toLocaleString()}</div>
          </div>
        </div>
      </Card>

      {/* Savings */}
      <Card title="Savings">
        <div className="p-4 bg-gray-800/50 rounded">
          <div className="text-sm text-gray-400 mb-1">Total Tokens Saved</div>
          <div className="text-3xl font-bold text-emerald-400">{savings.total.toLocaleString()}</div>
        </div>
      </Card>

      {/* Provider Breakdown Table */}
      <Card title="Provider Breakdown">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-2 text-left font-semibold text-gray-300">Provider</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-300">Tokens Used</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-300">Tokens Saved</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-300">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Claude', used: 12345, saved: 2345 },
              { name: 'OpenCode', used: 5678, saved: 1023 },
              { name: 'Cline', used: 3210, saved: 890 },
              { name: 'Gemini CLI', used: 1500, saved: 300 },
              { name: 'RTK', used: 8923, saved: 1502 },
              { name: 'Graphify', used: 4567, saved: 801 },
              { name: 'CodeGraph', used: 2100, saved: 450 },
            ].map((p) => (
              <tr key={p.name} className="border-t border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-2 font-medium text-white">{p.name}</td>
                <td className="px-4 py-2">{p.used.toLocaleString()}</td>
                <td className="px-4 py-2 text-green-400">{p.saved.toLocaleString()}</td>
                <td className="px-4 py-2">{((p.saved / p.used) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Quality Metrics */}
      <Card title="Quality Metrics">
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800/50 rounded text-center">
            <div className="text-sm text-gray-400 mb-1">Build Success</div>
            <div className="text-xl font-bold text-green-400">94%</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded text-center">
            <div className="text-sm text-gray-400 mb-1">Test Success</div>
            <div className="text-xl font-bold text-green-400">89%</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded text-center">
            <div className="text-sm text-gray-400 mb-1">Lint Pass</div>
            <div className="text-xl font-bold text-yellow-400">97%</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded text-center">
            <div className="text-sm text-gray-400 mb-1">First-Pass</div>
            <div className="text-xl font-bold text-blue-400">76%</div>
          </div>
        </div>
      </Card>
    </div>
  );
};