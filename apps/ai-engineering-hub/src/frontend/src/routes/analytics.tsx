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
  { accessorKey: "value", header: "Value", cell: (c) => fmt(c.getValue() as number) },
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
      <h1 className="page-title">Analytics</h1>

      <div className="row-gap">
        <span className="muted">Group tokens by</span>
        {(["source", "provider", "agent", "repository"] as GroupBy[]).map((g) => (
          <button
            key={g}
            className={`btn ${groupBy === g ? "" : "subtle"}`}
            onClick={() => setGroupBy(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="section-title">Token usage by {groupBy}</div>
      <DataTable data={tokenBreakdown[groupBy]} columns={valueCols(groupBy, num)} empty="No token events." />

      <div className="section-title">Savings by source</div>
      <DataTable data={data?.savings.by_source ?? []} columns={valueCols("Source", num)} empty="No savings events." />

      <div className="section-title">Productivity</div>
      <div className="cards">
        <Stat label="First-pass success" value={pct(data?.productivity.first_pass_success)} />
        <Stat label="Intervention rate" value={pct(data?.productivity.intervention_rate)} />
        <Stat label="Retry rate" value={pct(data?.productivity.retry_rate)} />
        <Stat label="Task completion" value={pct(data?.productivity.task_completion_rate)} />
        <Stat label="Build success" value={pct(data?.productivity.build_success)} />
        <Stat label="Test success" value={pct(data?.productivity.test_success)} />
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        "—" means no connected tool reports that signal yet. Token usage and savings above are
        live; productivity rates populate when a source emits task/build/test outcomes.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
