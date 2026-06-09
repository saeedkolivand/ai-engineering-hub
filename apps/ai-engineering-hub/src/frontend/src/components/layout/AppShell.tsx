import { useEffect, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { useHotkeys } from "react-hotkeys-hook";
import { NavBar } from "./NavBar";
import { RightPanel } from "./RightPanel";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from "../../lib/shortcuts";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useHotkeys("mod+k", (e) => { e.preventDefault(); setPaletteOpen((o) => !o); }, { enableOnFormTags: true }, []);

  useEffect(() => {
    void registerGlobalShortcuts();
    return () => {
      void unregisterGlobalShortcuts();
    };
  }, []);

  return (
    <div className="shell">
      <NavBar />
      <header className="topbar">
        <Breadcrumbs />
        <div className="spacer" />
        <button
          className="cmd-pill"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
        >
          <span>Search…</span>
          <span className="spacer" />
          <kbd className="cmd-key">⌘K</kbd>
        </button>
        <span className="live-dot">Live</span>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <RightPanel />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
