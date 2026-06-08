import { createFileRoute } from "@tanstack/react-router";
import { useAgents } from "../api/hooks";
import { agentsQuery } from "../lib/queries";

export const Route = createFileRoute("/agents/$agentId")({
  loader: ({ context }) => context.queryClient.ensureQueryData(agentsQuery()),
  component: AgentDetail,
});

function AgentDetail() {
  const { agentId } = Route.useParams();
  const agent = useAgents().data?.find((a) => a.id === agentId);
  if (!agent) return <div className="state">Agent not found.</div>;

  return (
    <div>
      <h1 className="page-title">{agent.name}</h1>
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="rp-row"><span className="k">Provider</span><span>{agent.provider}</span></div>
        <div className="rp-row"><span className="k">Model</span><span>{agent.model_id ?? "—"}</span></div>
        <div className="rp-row"><span className="k">ID</span><span>{agent.id.slice(0, 12)}</span></div>
      </div>
    </div>
  );
}
