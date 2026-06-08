import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Source, SourceCapabilities } from "shared-types";
import { DataTable } from "../components/DataTable";
import { useSources, useSetSourceEnabled } from "../api/hooks";
import { sourcesQuery } from "../lib/queries";
import { setSelection } from "../lib/store";
import { shortTime, num } from "../lib/format";

export const Route = createFileRoute("/integrations")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sourcesQuery()),
  component: Integrations,
});

const capList = (c: SourceCapabilities): string =>
  Object.entries(c)
    .filter(([, v]) => v)
    .map(([k]) => k.replace("emits_", ""))
    .join(", ") || "—";

function Integrations() {
  const { data } = useSources();
  const toggle = useSetSourceEnabled();
  const sources = data ?? [];
  const detected = sources.filter((s) => s.origin === "auto_detected" && !s.enabled);

  const columns: ColumnDef<Source, any>[] = [
    { accessorKey: "display_name", header: "Tool" },
    { accessorKey: "key", header: "Key" },
    { accessorKey: "origin", header: "Origin", cell: (c) => (c.getValue() as string).replace("_", " ") },
    { id: "caps", header: "Emits", cell: (c) => capList(c.row.original.capabilities) },
    { accessorKey: "event_count", header: "Events", cell: (c) => num(c.getValue() as number) },
    { accessorKey: "last_seen_at", header: "Last seen", cell: (c) => shortTime(c.getValue() as string) },
    {
      id: "enabled",
      header: "Enabled",
      cell: (c) => {
        const s = c.row.original;
        return (
          <button
            className={`btn ${s.enabled ? "" : "subtle"}`}
            onClick={(e) => {
              e.stopPropagation();
              toggle.mutate({ id: s.id, enabled: !s.enabled });
            }}
          >
            {s.enabled ? "Enabled" : "Enable"}
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <h1 className="page-title">Integrations</h1>
      <p className="muted">
        Tools are data, not code. Enabling a preset starts reading that tool's own local data
        (Claude Code, RTK, OpenCode, Cline, Gemini CLI) on a short poll — no extra setup.
        Unknown sources auto-register here on first event; other tools can push to the ingest API.
      </p>

      {detected.length > 0 && (
        <>
          <div className="section-title">Detected — needs review ({detected.length})</div>
          <DataTable data={detected} columns={columns} empty="" />
        </>
      )}

      <div className="section-title">All sources</div>
      <DataTable
        data={sources}
        columns={columns}
        searchPlaceholder="Filter sources…"
        empty="No sources yet."
        onRowClick={(s) =>
          setSelection({ kind: "source", id: s.id, label: s.display_name, meta: { key: s.key, origin: s.origin, emits: capList(s.capabilities), events: s.event_count } })
        }
      />
    </div>
  );
}
