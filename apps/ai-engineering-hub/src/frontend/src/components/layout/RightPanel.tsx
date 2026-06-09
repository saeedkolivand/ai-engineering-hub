import { useNavigate } from "@tanstack/react-router";
import { clearSelection, useSelection } from "../../lib/store";
import { CopyButton } from "../CopyButton";

/** Context panel: metadata + related entities + quick actions for the current selection. */
export function RightPanel() {
  const sel = useSelection();
  const navigate = useNavigate();

  if (!sel.kind) {
    return (
      <aside className="area-right border-l border-hairline bg-canvas overflow-y-auto px-md py-3">
        <div className="text-micro uppercase tracking-[.06em] text-ink-faint mb-1">Context</div>
        <div className="text-ui-lg font-semibold mb-2">Nothing selected</div>
        <p className="text-ui-sm text-ink-faint mt-2">
          Select a row in any table to see its metadata, related entities, and quick actions here.
          Press <strong>⌘K</strong> / <strong>Ctrl K</strong> to search.
        </p>
      </aside>
    );
  }

  const meta = sel.meta ?? {};
  const drillTo: Record<string, string> = {
    repository: `/repositories/${sel.id}`,
    session: `/sessions/${sel.id}`,
    task: `/tasks/${sel.id}`,
    agent: `/agents/${sel.id}`,
    source: `/integrations`,
  };

  return (
    <aside className="area-right border-l border-hairline bg-canvas overflow-y-auto px-md py-3">
      <div className="text-micro uppercase tracking-[.06em] text-ink-faint mb-1">{sel.kind}</div>
      <div className="text-ui-lg font-semibold mb-2">{sel.label ?? sel.id}</div>
      {Object.entries(meta).map(([k, v]) => (
        <div className="flex justify-between py-[5px] border-b border-divider-soft text-ui-sm" key={k}>
          <span className="text-ink-faint">{k}</span>
          <span>{v ?? "—"}</span>
        </div>
      ))}
      <div className="flex flex-col gap-2 mt-3">
        {sel.kind && drillTo[sel.kind] && (
          <button className="btn" onClick={() => navigate({ to: drillTo[sel.kind as string] })}>
            Open {sel.kind}
          </button>
        )}
        {sel.id && <CopyButton text={sel.id} label="Copy ID" />}
        <button className="btn subtle" onClick={clearSelection}>
          Clear selection
        </button>
      </div>
    </aside>
  );
}
