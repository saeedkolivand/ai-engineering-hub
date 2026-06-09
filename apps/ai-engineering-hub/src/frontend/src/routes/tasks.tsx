import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Task } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useTasks } from "../api/hooks";
import { tasksQuery } from "../lib/queries";
import { setSelection } from "../lib/store";
import { shortTime } from "../lib/format";

export const Route = createFileRoute("/tasks")({
  loader: ({ context }) => context.queryClient.ensureQueryData(tasksQuery()),
  component: Tasks,
});

function Tasks() {
  const { data } = useTasks();
  const navigate = useNavigate();

  const columns: ColumnDef<Task, any>[] = [
    { accessorKey: "description", header: "Task", cell: (c) => (c.getValue() as string) ?? "—" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "session_id", header: "Session", cell: (c) => (c.getValue() as string).slice(0, 8) },
    { accessorKey: "started_at", header: "Started", cell: (c) => shortTime(c.getValue() as string) },
  ];

  return (
    <div>
      <h1 className="text-metric font-display font-semibold tracking-[-0.3px] m-0 mb-4">Tasks</h1>
      <DataTable
        data={data ?? []}
        columns={columns}
        searchPlaceholder="Filter tasks…"
        empty="No tasks yet."
        onRowClick={(t) => {
          setSelection({ kind: "task", id: t.id, label: t.description ?? t.id, meta: { status: t.status, session: t.session_id } });
          navigate({ to: "/tasks/$taskId", params: { taskId: t.id } });
        }}
      />
    </div>
  );
}
