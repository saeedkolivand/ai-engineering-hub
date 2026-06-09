import { Link, useRouterState } from "@tanstack/react-router";

const LABELS: Record<string, string> = {
  "": "Overview",
  repositories: "Repositories",
  sessions: "Sessions",
  tasks: "Tasks",
  agents: "Agents",
  retrieval: "Retrieval",
  analytics: "Analytics",
  quality: "Quality",
  activity: "Activity",
  settings: "Settings",
  integrations: "Integrations",
};

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = [{ to: "/", label: "Overview" }];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ to: acc, label: LABELS[seg] ?? decodeURIComponent(seg) });
  }

  return (
    <div className="flex items-center gap-1 text-ui text-ink-faint">
      {crumbs.map((c, i) => (
        <span key={c.to} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-40">/</span>}
          {i === crumbs.length - 1 ? <span>{c.label}</span> : <Link to={c.to}>{c.label}</Link>}
        </span>
      ))}
    </div>
  );
}
