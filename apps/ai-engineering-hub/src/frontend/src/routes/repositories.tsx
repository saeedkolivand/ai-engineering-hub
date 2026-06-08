import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Repository } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useRepositories } from "../api/hooks";
import { repositoriesQuery } from "../lib/queries";
import { setSelection } from "../lib/store";
import { shortTime } from "../lib/format";

export const Route = createFileRoute("/repositories")({
  loader: ({ context }) => context.queryClient.ensureQueryData(repositoriesQuery()),
  component: Repositories,
});

function Repositories() {
  const { data } = useRepositories();
  const navigate = useNavigate();

  const columns: ColumnDef<Repository, any>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "path", header: "Path" },
    { accessorKey: "created_at", header: "Created", cell: (c) => shortTime(c.getValue() as string) },
  ];

  return (
    <div>
      <h1 className="page-title">Repositories</h1>
      <DataTable
        data={data ?? []}
        columns={columns}
        searchPlaceholder="Filter repositories…"
        empty="No repositories yet — ingest events to populate."
        onRowClick={(r) => {
          setSelection({ kind: "repository", id: r.id, label: r.name, meta: { path: r.path, created: r.created_at } });
          navigate({ to: "/repositories/$repositoryId", params: { repositoryId: r.id } });
        }}
      />
    </div>
  );
}
