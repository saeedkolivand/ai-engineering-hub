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
    <div className="bg-canvas border border-hairline rounded-md p-3">
      <div className="text-ui-sm text-ink-faint">{label}</div>
      <div className="text-metric font-semibold">{value}</div>
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
      <h1 className="text-metric font-display font-semibold tracking-[-0.3px] m-0 mb-4">Overview</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mb-4">
        <Stat label="Repositories" value={num(repos.data?.length)} />
        <Stat label="Sessions" value={num(sessions.data?.length)} />
        <Stat label="Tasks" value={num(tasks.data?.length)} />
        <Stat label="Agents" value={num(agents.data?.length)} />
        <Stat label="Tokens (today)" value={num(a?.tokens.daily_usage)} />
        <Stat label="Tokens (month)" value={num(a?.tokens.monthly_usage)} />
        <Stat label="Total savings" value={num(a?.savings.total_savings)} />
        <Stat label="First-pass success" value={pct(a?.productivity.first_pass_success)} />
      </div>

      <div className="text-ui-lg font-semibold mt-6 mb-2">Tokens by source</div>
      <DataTable data={a?.tokens.source_breakdown ?? []} columns={breakdownCols} empty="No token events yet." />
    </div>
  );
}
