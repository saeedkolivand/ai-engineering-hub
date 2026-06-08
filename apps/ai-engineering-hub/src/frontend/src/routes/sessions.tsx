import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Session } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useSessions } from "../api/hooks";
import { sessionsQuery } from "../lib/queries";
import { setSelection } from "../lib/store";
import { shortTime } from "../lib/format";

export const Route = createFileRoute("/sessions")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sessionsQuery()),
  component: Sessions,
});

function Sessions() {
  const { data } = useSessions();
  const navigate = useNavigate();

  const columns: ColumnDef<Session, any>[] = [
    { accessorKey: "id", header: "Session", cell: (c) => (c.getValue() as string).slice(0, 8) },
    { accessorKey: "repository_id", header: "Repository", cell: (c) => (c.getValue() as string).slice(0, 8) },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "start_time", header: "Started", cell: (c) => shortTime(c.getValue() as string) },
  ];

  return (
    <div>
      <h1 className="page-title">Sessions</h1>
      <DataTable
        data={data ?? []}
        columns={columns}
        searchPlaceholder="Filter sessions…"
        empty="No sessions yet."
        onRowClick={(s) => {
          setSelection({ kind: "session", id: s.id, label: s.status, meta: { repository: s.repository_id, status: s.status } });
          navigate({ to: "/sessions/$sessionId", params: { sessionId: s.id } });
        }}
      />
    </div>
  );
}
