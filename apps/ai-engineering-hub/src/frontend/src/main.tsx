import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/queryClient";
import { initTheme } from "./lib/theme";
import { checkForUpdates } from "./lib/updater";
import "shared-design-tokens/tokens.css";
import "./styles.css";

// Apply the saved theme before first paint (also tracks the OS in "system" mode).
initTheme();
// Self-update check (no-op outside the packaged desktop app).
void checkForUpdates();

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: () => <div className="state">Loading…</div>,
  defaultErrorComponent: ({ error }) => (
    <div className="error-box">
      <strong>Could not load.</strong> {String((error as Error)?.message ?? error)}
      <div className="muted" style={{ marginTop: 8 }}>
        Is the Hub running? The API serves on 127.0.0.1:47800.
      </div>
    </div>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Deep-link handler: aeh://session/<id>, aeh://repository/<id>, etc.
if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
  void import("@tauri-apps/plugin-deep-link").then(({ onOpenUrl }) => {
    onOpenUrl((urls: string[]) => {
      for (const raw of urls) {
        try {
          const url = new URL(raw);
          // scheme: aeh  host: entity-type  pathname: /id
          const kind = url.hostname; // e.g. "session", "repository", "task"
          const id = url.pathname.replace(/^\//, "");
          const map: Record<string, string> = {
            session: `/sessions/${id}`,
            repository: `/repositories/${id}`,
            task: `/tasks/${id}`,
            agent: `/agents/${id}`,
          };
          const path = map[kind];
          if (path) void router.navigate({ to: path as any });
        } catch {
          // malformed deep link — ignore
        }
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
