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
  { accessorKey: "value", header: "Avg latency", cell: (c) => ms(c.getValue() as number) },
];

function Retrieval() {
  const r = useAnalytics().data?.retrieval;
  const intel = useIntelligence().data;

  return (
    <div>
      <h1 className="page-title">Retrieval</h1>
      <div className="cards">
        <div className="card"><div className="label">Accuracy</div><div className="value">{r ? `${(r.accuracy * 100).toFixed(0)}%` : "—"}</div></div>
        <div className="card"><div className="label">Avg latency</div><div className="value">{ms(r?.latency)}</div></div>
        <div className="card"><div className="label">Savings</div><div className="value">{num(r?.savings)}</div></div>
      </div>
      <div className="section-title">Retrieval bottlenecks (avg latency by source)</div>
      <DataTable data={intel?.retrieval_bottlenecks ?? []} columns={bottleneckCols} empty="No retrieval events." />
    </div>
  );
}
