import { createFileRoute } from "@tanstack/react-router";
import { useTasks } from "../api/hooks";
import { tasksQuery } from "../lib/queries";
import { shortTime } from "../lib/format";

export const Route = createFileRoute("/tasks/$taskId")({
  loader: ({ context }) => context.queryClient.ensureQueryData(tasksQuery()),
  component: TaskDetail,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const tasks = useTasks();
  const task = tasks.data?.find((t) => t.id === taskId);

  if (!task) return <div className="p-8 text-center text-ink-faint">Task not found.</div>;

  return (
    <div>
      <h1 className="text-metric font-display font-semibold tracking-[-0.3px] m-0 mb-4">{task.description ?? `Task ${task.id.slice(0, 8)}`}</h1>
      <div className="bg-canvas border border-hairline rounded-md p-3" style={{ maxWidth: 420 }}>
        <div className="flex justify-between py-[5px] border-b border-divider-soft text-ui-sm">
          <span className="text-ink-faint">Status</span><span>{task.status}</span>
        </div>
        <div className="flex justify-between py-[5px] border-b border-divider-soft text-ui-sm">
          <span className="text-ink-faint">Session</span><span>{task.session_id.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between py-[5px] border-b border-divider-soft text-ui-sm">
          <span className="text-ink-faint">Started</span><span>{shortTime(task.started_at)}</span>
        </div>
        <div className="flex justify-between py-[5px] border-b border-divider-soft text-ui-sm">
          <span className="text-ink-faint">Completed</span><span>{shortTime(task.completed_at)}</span>
        </div>
      </div>
    </div>
  );
}
