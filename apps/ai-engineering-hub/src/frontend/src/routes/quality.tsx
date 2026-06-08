import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/DataTable";
import { useAnalytics } from "../api/hooks";
import { analyticsQuery } from "../lib/queries";
import { pct } from "../lib/format";

export const Route = createFileRoute("/quality")({
  loader: ({ context }) => context.queryClient.ensureQueryData(analyticsQuery()),
  component: Quality,
});

interface MetricRow {
  metric: string;
  value: number;
}
const cols: ColumnDef<MetricRow, any>[] = [
  { accessorKey: "metric", header: "Metric" },
  { accessorKey: "value", header: "Value", cell: (c) => pct(c.getValue() as number) },
];

function Quality() {
  const q = useAnalytics().data?.quality;
  const rows: MetricRow[] = [
    { metric: "Build success", value: q?.build_success ?? 0 },
    { metric: "Test success", value: q?.test_success ?? 0 },
    { metric: "Lint success", value: q?.lint_success ?? 0 },
    { metric: "Regressions", value: q?.regressions ?? 0 },
  ];

  return (
    <div>
      <h1 className="page-title">Quality</h1>
      <DataTable data={rows} columns={cols} searchPlaceholder="Filter metrics…" />
    </div>
  );
}
