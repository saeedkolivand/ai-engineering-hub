import { useEffect, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { useHotkeys } from "react-hotkeys-hook";
import { NavBar } from "./NavBar";
import { RightPanel } from "./RightPanel";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { UpdateBanner } from "../UpdateBanner";
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
      <header className="area-topbar flex items-center gap-3 px-4 border-b border-hairline bg-canvas h-[var(--topbar-h)]">
        <Breadcrumbs />
        <div className="flex-1" />
        <button
          className="flex items-center gap-2 text-ui text-ink-faint bg-pearl border border-hairline rounded-pill px-3 py-1"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
        >
          <span>Search…</span>
          <div className="flex-1" />
          <kbd className="text-micro bg-canvas border border-hairline rounded-xs px-1">⌘K</kbd>
        </button>
        <span className="live-dot">Live</span>
      </header>
      <main className="area-main overflow-auto" style={{ display: "flex", flexDirection: "column" }}>
        <UpdateBanner />
        <div className="p-md" style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>
      <RightPanel />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
