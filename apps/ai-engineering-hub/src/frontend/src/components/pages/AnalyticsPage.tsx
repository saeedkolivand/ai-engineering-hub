import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from 'shared-ui';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';

interface TokenMetrics {
  period: string;
  usage: number;
}
interface SavingsMetrics {
  provider: string;
  saved_tokens: number;
}
interface ProductivityMetrics {
  metric: string;
  value: number;
}

function DataTable<T extends object>({ data, columns }: { data: T[]; columns: any[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
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
  );
}

const tokenHelper = createColumnHelper<TokenMetrics>();
const savingsHelper = createColumnHelper<SavingsMetrics>();
const productivityHelper = createColumnHelper<ProductivityMetrics>();

const tokenColumns = [
  tokenHelper.accessor('period', { header: 'Period' }),
  tokenHelper.accessor('usage', { header: 'Tokens Used' }),
];

const savingsColumns = [
  savingsHelper.accessor('provider', { header: 'Provider' }),
  savingsHelper.accessor('saved_tokens', { header: 'Saved Tokens' }),
];

const productivityColumns = [
  productivityHelper.accessor('metric', { header: 'Metric' }),
  productivityHelper.accessor('value', { header: 'Value' }),
];

export const AnalyticsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['analytics'], async () => {
    const res = await fetch('http://localhost:3000/api/analytics');
    return res.json();
  });

  if (isLoading) return <div>Loading analytics...</div>;
  if (error) return <div>Error loading analytics.</div>;

  return (
    <Card title="Analytics">
      <TabGroup>
        <TabList className="flex space-x-2 border-b mb-4">
          <Tab className="px-3 py-1 focus:outline-none data-[selected]:border-b-2 data-[selected]:border-blue-500">
            Tokens
          </Tab>
          <Tab className="px-3 py-1 focus:outline-none data-[selected]:border-b-2 data-[selected]:border-blue-500">
            Savings
          </Tab>
          <Tab className="px-3 py-1 focus:outline-none data-[selected]:border-b-2 data-[selected]:border-blue-500">
            Productivity
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DataTable data={data?.tokens ?? []} columns={tokenColumns} />
          </TabPanel>
          <TabPanel>
            <DataTable data={data?.savings ?? []} columns={savingsColumns} />
          </TabPanel>
          <TabPanel>
            <DataTable data={data?.productivity ?? []} columns={productivityColumns} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
};