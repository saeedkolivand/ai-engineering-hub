import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "../components/DataTable";
import { useAgents, useAnalytics, useRepositories, useSessions, useTasks } from "../api/hooks";
import { analyticsQuery } from "../lib/queries";
import { num, pct } from "../lib/format";
import type { Breakdown } from "shared-types";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(analyticsQuery()),
  component: Overview,
});

const breakdownCols: ColumnDef<Breakdown, any>[] = [
  { accessorKey: "label", header: "Source" },
  { accessorKey: "value", header: "Tokens", meta: { numeric: true }, cell: (c) => num(c.getValue() as number) },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function Overview() {
  const analytics = useAnalytics();
  const repos = useRepositories();
  const sessions = useSessions();
  const tasks = useTasks();
  const agents = useAgents();
  const a = analytics.data;

  return (
    <div>
      <h1 className="page-title">Overview</h1>
      <div className="cards">
        <Stat label="Repositories" value={num(repos.data?.length)} />
        <Stat label="Sessions" value={num(sessions.data?.length)} />
        <Stat label="Tasks" value={num(tasks.data?.length)} />
        <Stat label="Agents" value={num(agents.data?.length)} />
        <Stat label="Tokens (today)" value={num(a?.tokens.daily_usage)} />
        <Stat label="Tokens (month)" value={num(a?.tokens.monthly_usage)} />
        <Stat label="Total savings" value={num(a?.savings.total_savings)} />
        <Stat label="First-pass success" value={pct(a?.productivity.first_pass_success)} />
      </div>

      <div className="section-title">Tokens by source</div>
      <DataTable data={a?.tokens.source_breakdown ?? []} columns={breakdownCols} empty="No token events yet." />
    </div>
  );
}
