import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Task } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useTasks } from "../api/hooks";
import { tasksQuery } from "../lib/queries";
import { setSelection } from "../lib/store";
import { shortTime } from "../lib/format";

export const Route = createFileRoute("/sessions/$sessionId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(tasksQuery(params.sessionId)),
  component: SessionDetail,
});

function SessionDetail() {
  const { sessionId } = Route.useParams();
  const tasks = useTasks(sessionId);
  const navigate = useNavigate();

  const columns: ColumnDef<Task, any>[] = [
    { accessorKey: "description", header: "Task", cell: (c) => (c.getValue() as string) ?? "—" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "started_at", header: "Started", cell: (c) => shortTime(c.getValue() as string) },
    { accessorKey: "completed_at", header: "Completed", cell: (c) => shortTime(c.getValue() as string) },
  ];

  return (
    <div>
      <h1 className="page-title">Session {sessionId.slice(0, 8)}</h1>
      <div className="section-title">Tasks</div>
      <DataTable
        data={tasks.data ?? []}
        columns={columns}
        searchPlaceholder="Filter tasks…"
        empty="No tasks in this session."
        onRowClick={(t) => {
          setSelection({ kind: "task", id: t.id, label: t.description ?? t.id, meta: { status: t.status, session: sessionId } });
          navigate({ to: "/tasks/$taskId", params: { taskId: t.id } });
        }}
      />
    </div>
  );
}
