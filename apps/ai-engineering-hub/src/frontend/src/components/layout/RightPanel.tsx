import { useNavigate } from "@tanstack/react-router";
import { clearSelection, useSelection } from "../../lib/store";

/** Context panel: metadata + related entities + quick actions for the current selection. */
export function RightPanel() {
  const sel = useSelection();
  const navigate = useNavigate();

  if (!sel.kind) {
    return (
      <aside className="right">
        <div className="rp-kind">Context</div>
        <div className="rp-title">Nothing selected</div>
        <p className="rp-empty">
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
    <aside className="right">
      <div className="rp-kind">{sel.kind}</div>
      <div className="rp-title">{sel.label ?? sel.id}</div>
      {Object.entries(meta).map(([k, v]) => (
        <div className="rp-row" key={k}>
          <span className="k">{k}</span>
          <span>{v ?? "—"}</span>
        </div>
      ))}
      <div className="rp-actions">
        {sel.kind && drillTo[sel.kind] && (
          <button className="btn" onClick={() => navigate({ to: drillTo[sel.kind as string] })}>
            Open {sel.kind}
          </button>
        )}
        <button className="btn subtle" onClick={clearSelection}>
          Clear selection
        </button>
      </div>
    </aside>
  );
}
