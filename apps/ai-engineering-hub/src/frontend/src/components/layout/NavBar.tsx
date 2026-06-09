import { Link } from "@tanstack/react-router";

const WORKSPACE: { to: string; label: string; exact?: boolean }[] = [
  { to: "/", label: "Overview", exact: true },
  { to: "/repositories", label: "Repositories" },
  { to: "/sessions", label: "Sessions" },
  { to: "/tasks", label: "Tasks" },
  { to: "/agents", label: "Agents" },
  { to: "/retrieval", label: "Retrieval" },
  { to: "/analytics", label: "Analytics" },
  { to: "/quality", label: "Quality" },
  { to: "/activity", label: "Activity" },
  { to: "/settings", label: "Settings" },
];

const linkClass = "block px-2 py-[6px] rounded-xs text-ui text-on-dark-muted no-underline";
const groupClass = "text-micro uppercase tracking-[.08em] text-on-dark-muted px-2 pt-3 pb-1 font-semibold opacity-50";

export function NavBar() {
  return (
    <nav className="area-nav flex flex-col bg-surface-1 border-r border-hairline overflow-y-auto pt-3 pb-4 px-2">
      <div className="text-[10px] font-semibold tracking-[.08em] text-on-dark-muted uppercase px-2 pb-3 opacity-40">
        AI Engineering Hub
      </div>
      <div className={groupClass}>Workspace</div>
      {WORKSPACE.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className={linkClass}
          activeProps={{ className: `${linkClass} active` }}
          activeOptions={{ exact: it.exact }}
        >
          {it.label}
        </Link>
      ))}
      <div className={groupClass}>Tools</div>
      <Link to="/integrations" className={linkClass} activeProps={{ className: `${linkClass} active` }}>
        Integrations
      </Link>
    </nav>
  );
}
