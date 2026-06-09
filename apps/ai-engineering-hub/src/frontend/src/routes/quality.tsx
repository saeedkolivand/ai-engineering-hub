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
  value: number | null;
}
const cols: ColumnDef<MetricRow, any>[] = [
  { accessorKey: "metric", header: "Metric" },
  { accessorKey: "value", header: "Value", meta: { numeric: true }, cell: (c) => pct(c.getValue() as number | null) },
];

function Quality() {
  const q = useAnalytics().data?.quality;
  const rows: MetricRow[] = [
    { metric: "Build success", value: q?.build_success ?? null },
    { metric: "Test success", value: q?.test_success ?? null },
    { metric: "Lint success", value: q?.lint_success ?? null },
    { metric: "Regressions", value: q?.regressions ?? null },
  ];
  const noData = rows.every((r) => r.value == null);

  return (
    <div>
      <h1 className="text-metric font-display font-semibold tracking-[-0.3px] m-0 mb-4">Quality</h1>
      <DataTable data={rows} columns={cols} searchPlaceholder="Filter metrics…" />
      {noData && (
        <p className="text-ink-faint" style={{ marginTop: 12 }}>
          "—" means no connected tool reports build/test/lint outcomes yet. These populate when a
          source emits <code>build_status</code>/<code>test_status</code>/<code>lint_status</code>
          {" "}events (e.g. a CI reporter or the <code>/api/v1/ingest</code> API).
        </p>
      )}
    </div>
  );
}
