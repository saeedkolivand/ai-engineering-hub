import { Outlet } from "@tanstack/react-router";
import { NavBar } from "./NavBar";
import { RightPanel } from "./RightPanel";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";

export function AppShell() {
  return (
    <div className="shell">
      <NavBar />
      <header className="topbar">
        <Breadcrumbs />
        <div className="spacer" />
        <span className="muted" style={{ fontSize: "var(--fs-ui-sm)" }}>
          Press ⌘K / Ctrl K to search
        </span>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <RightPanel />
      <CommandPalette />
    </div>
  );
}
