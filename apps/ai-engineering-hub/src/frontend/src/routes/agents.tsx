import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Agent } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useAgents } from "../api/hooks";
import { agentsQuery } from "../lib/queries";
import { setSelection } from "../lib/store";

export const Route = createFileRoute("/agents")({
  loader: ({ context }) => context.queryClient.ensureQueryData(agentsQuery()),
  component: Agents,
});

function Agents() {
  const { data } = useAgents();
  const navigate = useNavigate();

  const columns: ColumnDef<Agent, any>[] = [
    { accessorKey: "name", header: "Agent" },
    { accessorKey: "provider", header: "Provider" },
    { accessorKey: "model_id", header: "Model", cell: (c) => (c.getValue() as string) ?? "—" },
  ];

  return (
    <div>
      <h1 className="page-title">Agents</h1>
      <DataTable
        data={data ?? []}
        columns={columns}
        searchPlaceholder="Filter agents…"
        empty="No agents yet."
        onRowClick={(a) => {
          setSelection({ kind: "agent", id: a.id, label: a.name, meta: { provider: a.provider, model: a.model_id } });
          navigate({ to: "/agents/$agentId", params: { agentId: a.id } });
        }}
      />
    </div>
  );
}
