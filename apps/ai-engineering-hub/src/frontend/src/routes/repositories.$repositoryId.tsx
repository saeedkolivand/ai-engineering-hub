import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Session } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useRepository, useSessions } from "../api/hooks";
import { repositoryQuery, sessionsQuery } from "../lib/queries";
import { setSelection } from "../lib/store";
import { shortTime } from "../lib/format";

export const Route = createFileRoute("/repositories/$repositoryId")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(repositoryQuery(params.repositoryId)),
      context.queryClient.ensureQueryData(sessionsQuery(params.repositoryId)),
    ]),
  component: RepositoryDetail,
});

function RepositoryDetail() {
  const { repositoryId } = Route.useParams();
  const repo = useRepository(repositoryId);
  const sessions = useSessions(repositoryId);
  const navigate = useNavigate();

  const columns: ColumnDef<Session, any>[] = [
    { accessorKey: "id", header: "Session", cell: (c) => (c.getValue() as string).slice(0, 8) },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "start_time", header: "Started", cell: (c) => shortTime(c.getValue() as string) },
    { accessorKey: "end_time", header: "Ended", cell: (c) => shortTime(c.getValue() as string) },
  ];

  return (
    <div>
      <h1 className="page-title">{repo.data?.name ?? "Repository"}</h1>
      <div className="muted">{repo.data?.path}</div>
      <div className="section-title">Sessions</div>
      <DataTable
        data={sessions.data ?? []}
        columns={columns}
        searchPlaceholder="Filter sessions…"
        empty="No sessions for this repository."
        onRowClick={(s) => {
          setSelection({ kind: "session", id: s.id, label: s.status, meta: { repository: repositoryId, status: s.status } });
          navigate({ to: "/sessions/$sessionId", params: { sessionId: s.id } });
        }}
      />
    </div>
  );
}
