import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Breakdown } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useAnalytics, useIntelligence } from "../api/hooks";
import { analyticsQuery, intelligenceQuery } from "../lib/queries";
import { ms, num } from "../lib/format";

export const Route = createFileRoute("/retrieval")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(analyticsQuery()),
      context.queryClient.ensureQueryData(intelligenceQuery()),
    ]),
  component: Retrieval,
});

const bottleneckCols: ColumnDef<Breakdown, any>[] = [
  { accessorKey: "label", header: "Source" },
  { accessorKey: "value", header: "Avg latency", meta: { numeric: true }, cell: (c) => ms(c.getValue() as number) },
];

function Retrieval() {
  const r = useAnalytics().data?.retrieval;
  const intel = useIntelligence().data;

  return (
    <div>
      <h1 className="text-metric font-display font-semibold tracking-[-0.3px] m-0 mb-4">Retrieval</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mb-4">
        <div className="bg-canvas border border-hairline rounded-md p-3">
          <div className="text-ui-sm text-ink-faint">Accuracy</div>
          <div className="text-metric font-semibold">{r?.accuracy == null ? "—" : `${(r.accuracy * 100).toFixed(0)}%`}</div>
        </div>
        <div className="bg-canvas border border-hairline rounded-md p-3">
          <div className="text-ui-sm text-ink-faint">Avg latency</div>
          <div className="text-metric font-semibold">{ms(r?.latency)}</div>
        </div>
        <div className="bg-canvas border border-hairline rounded-md p-3">
          <div className="text-ui-sm text-ink-faint">Savings</div>
          <div className="text-metric font-semibold">{num(r?.savings)}</div>
        </div>
      </div>
      <p className="text-ink-faint" style={{ marginTop: 8 }}>
        Latency and savings come from retrieval-class commands (search / read / list) reported by
        sources like RTK. Accuracy shows "—" until a source reports it.
      </p>
      <div className="text-ui-lg font-semibold mt-6 mb-2">Retrieval bottlenecks (avg latency by source)</div>
      <DataTable data={intel?.retrieval_bottlenecks ?? []} columns={bottleneckCols} empty="No retrieval events." />
    </div>
  );
}
