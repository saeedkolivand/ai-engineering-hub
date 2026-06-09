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

export function NavBar() {
  return (
    <nav className="nav">
      <div className="brand">AI Engineering Hub</div>
      <div className="nav-group">Workspace</div>
      {WORKSPACE.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          activeProps={{ className: "active" }}
          activeOptions={{ exact: it.exact }}
        >
          {it.label}
        </Link>
      ))}
      <div className="nav-group">Tools</div>
      <Link to="/integrations" activeProps={{ className: "active" }}>
        Integrations
      </Link>
    </nav>
  );
}
