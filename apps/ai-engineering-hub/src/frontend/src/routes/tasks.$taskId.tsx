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

  if (!task) return <div className="state">Task not found.</div>;

  return (
    <div>
      <h1 className="page-title">{task.description ?? `Task ${task.id.slice(0, 8)}`}</h1>
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="rp-row"><span className="k">Status</span><span>{task.status}</span></div>
        <div className="rp-row"><span className="k">Session</span><span>{task.session_id.slice(0, 8)}</span></div>
        <div className="rp-row"><span className="k">Started</span><span>{shortTime(task.started_at)}</span></div>
        <div className="rp-row"><span className="k">Completed</span><span>{shortTime(task.completed_at)}</span></div>
      </div>
    </div>
  );
}
