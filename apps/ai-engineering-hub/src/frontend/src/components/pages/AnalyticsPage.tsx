import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from 'shared-ui';
import { Table } from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/react-table';
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

export const AnalyticsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['analytics'], async () => {
    const res = await fetch('http://localhost:3000/api/analytics');
    return res.json();
  });

  const tokenColumns: ColumnDef<TokenMetrics, any>[] = React.useMemo(() => [
    { accessorKey: 'period', header: 'Period' },
    { accessorKey: 'usage', header: 'Tokens Used' },
  ], []);

  const savingsColumns: ColumnDef<SavingsMetrics, any>[] = React.useMemo(() => [
    { accessorKey: 'provider', header: 'Provider' },
    { accessorKey: 'saved_tokens', header: 'Saved Tokens' },
  ], []);

  const productivityColumns: ColumnDef<ProductivityMetrics, any>[] = React.useMemo(() => [
    { accessorKey: 'metric', header: 'Metric' },
    { accessorKey: 'value', header: 'Value' },
  ], []);

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
            <Table data={data.tokens ?? []} columns={tokenColumns} />
          </TabPanel>
          <TabPanel>
            <Table data={data.savings ?? []} columns={savingsColumns} />
          </TabPanel>
          <TabPanel>
            <Table data={data.productivity ?? []} columns={productivityColumns} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
};