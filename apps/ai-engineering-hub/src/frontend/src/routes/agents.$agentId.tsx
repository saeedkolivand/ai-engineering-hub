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
  if (!agent) return <div className="p-8 text-center text-ink-faint">Agent not found.</div>;

  return (
    <div>
      <h1 className="text-metric font-display font-semibold tracking-[-0.3px] m-0 mb-4">{agent.name}</h1>
      <div className="bg-canvas border border-hairline rounded-md p-3" style={{ maxWidth: 420 }}>
        <div className="flex justify-between py-[5px] border-b border-divider-soft text-ui-sm">
          <span className="text-ink-faint">Provider</span><span>{agent.provider}</span>
        </div>
        <div className="flex justify-between py-[5px] border-b border-divider-soft text-ui-sm">
          <span className="text-ink-faint">Model</span><span>{agent.model_id ?? "—"}</span>
        </div>
        <div className="flex justify-between py-[5px] border-b border-divider-soft text-ui-sm">
          <span className="text-ink-faint">ID</span><span>{agent.id.slice(0, 12)}</span>
        </div>
      </div>
    </div>
  );
}
