import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Breakdown, GroupBy } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useAnalytics } from "../api/hooks";
import { analyticsQuery } from "../lib/queries";
import { num, pct } from "../lib/format";

export const Route = createFileRoute("/analytics")({
  loader: ({ context }) => context.queryClient.ensureQueryData(analyticsQuery()),
  component: Analytics,
});

const valueCols = (label: string, fmt: (n: number) => string): ColumnDef<Breakdown, any>[] => [
  { accessorKey: "label", header: label },
  { accessorKey: "value", header: "Value", meta: { numeric: true }, cell: (c) => fmt(c.getValue() as number) },
];

function Analytics() {
  const { data } = useAnalytics();
  const [groupBy, setGroupBy] = useState<GroupBy>("source");

  const tokenBreakdown: Record<GroupBy, Breakdown[]> = {
    source: data?.tokens.source_breakdown ?? [],
    provider: data?.tokens.provider_breakdown ?? [],
    agent: data?.tokens.agent_breakdown ?? [],
    repository: data?.tokens.repository_breakdown ?? [],
  };

  return (
    <div>
      <h1 className="text-metric font-display font-semibold tracking-[-0.3px] m-0 mb-4">Analytics</h1>

      <div className="flex gap-3 flex-wrap items-center mb-4">
        <span className="text-ink-faint">Group tokens by</span>
        <div className="flex rounded-xs border border-hairline overflow-hidden">
          {(["source", "provider", "agent", "repository"] as GroupBy[]).map((g) => (
            <button
              key={g}
              className={`px-3 py-1 text-ui border-0 ${groupBy === g ? "bg-canvas font-semibold text-ink" : "bg-transparent text-ink-faint"}`}
              onClick={() => setGroupBy(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="text-ui-lg font-semibold mt-6 mb-2">Token usage by {groupBy}</div>
      <DataTable data={tokenBreakdown[groupBy]} columns={valueCols(groupBy, num)} empty="No token events." />

      <div className="text-ui-lg font-semibold mt-6 mb-2">Savings by source</div>
      <DataTable data={data?.savings.by_source ?? []} columns={valueCols("Source", num)} empty="No savings events." />

      <div className="text-ui-lg font-semibold mt-6 mb-2">Productivity</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mb-4">
        <Stat label="First-pass success" value={pct(data?.productivity.first_pass_success)} />
        <Stat label="Intervention rate" value={pct(data?.productivity.intervention_rate)} />
        <Stat label="Retry rate" value={pct(data?.productivity.retry_rate)} />
        <Stat label="Task completion" value={pct(data?.productivity.task_completion_rate)} />
        <Stat label="Build success" value={pct(data?.productivity.build_success)} />
        <Stat label="Test success" value={pct(data?.productivity.test_success)} />
      </div>
      <p className="text-ink-faint" style={{ marginTop: 8 }}>
        "—" means no connected tool reports that signal yet. Token usage and savings above are
        live; productivity rates populate when a source emits task/build/test outcomes.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas border border-hairline rounded-md p-3">
      <div className="text-ui-sm text-ink-faint">{label}</div>
      <div className="text-metric font-semibold">{value}</div>
    </div>
  );
}
