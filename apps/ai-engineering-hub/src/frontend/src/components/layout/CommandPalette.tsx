import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useHotkeys } from "react-hotkeys-hook";
import { useAgents, useRepositories, useSessions, useTasks } from "../../api/hooks";

interface Cmd {
  group: string;
  label: string;
  to: string;
  tag?: string;
}

const NAV: Cmd[] = [
  { group: "Go to", label: "Overview", to: "/" },
  { group: "Go to", label: "Repositories", to: "/repositories" },
  { group: "Go to", label: "Sessions", to: "/sessions" },
  { group: "Go to", label: "Tasks", to: "/tasks" },
  { group: "Go to", label: "Agents", to: "/agents" },
  { group: "Go to", label: "Retrieval", to: "/retrieval" },
  { group: "Go to", label: "Analytics", to: "/analytics" },
  { group: "Go to", label: "Quality", to: "/quality" },
  { group: "Go to", label: "Activity", to: "/activity" },
  { group: "Go to", label: "Settings", to: "/settings" },
  { group: "Go to", label: "Integrations", to: "/integrations" },
];

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const repos = useRepositories();
  const sessions = useSessions();
  const tasks = useTasks();
  const agents = useAgents();

  const all: Cmd[] = useMemo(() => {
    const entities: Cmd[] = [
      ...(repos.data ?? []).map((r) => ({ group: "Repositories", label: r.name, to: `/repositories/${r.id}`, tag: "repo" })),
      ...(sessions.data ?? []).map((s) => ({ group: "Sessions", label: `${s.status} · ${s.id.slice(0, 8)}`, to: `/sessions/${s.id}`, tag: "session" })),
      ...(tasks.data ?? []).map((t) => ({ group: "Tasks", label: t.description ?? t.id.slice(0, 8), to: `/tasks/${t.id}`, tag: "task" })),
      ...(agents.data ?? []).map((a) => ({ group: "Agents", label: `${a.name} (${a.provider})`, to: `/agents/${a.id}`, tag: "agent" })),
    ];
    return [...NAV, ...entities];
  }, [repos.data, sessions.data, tasks.data, agents.data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? all.filter((c) => c.label.toLowerCase().includes(needle)) : NAV;
    return list.slice(0, 50);
  }, [q, all]);

  const go = (to: string) => {
    onClose();
    navigate({ to });
  };

  // Group while preserving order.
  const groups: Record<string, Cmd[]> = {};
  for (const c of filtered) (groups[c.group] ??= []).push(c);

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Search repositories, sessions, tasks, agents, pages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered[0]) go(filtered[0].to);
            if (e.key === "Escape") onClose();
          }}
        />
        <div className="cp-list">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div className="cp-group">{group}</div>
              {items.map((c) => (
                <div className="cp-item" key={`${c.group}-${c.to}`} onClick={() => go(c.to)}>
                  <span>{c.label}</span>
                  {c.tag && <span className="tag">{c.tag}</span>}
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="cp-item muted">No matches</div>}
        </div>
      </div>
    </div>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  useHotkeys("escape", onClose, { enableOnFormTags: true, enabled: open }, [open, onClose]);
  return open ? <Palette onClose={onClose} /> : null;
}
