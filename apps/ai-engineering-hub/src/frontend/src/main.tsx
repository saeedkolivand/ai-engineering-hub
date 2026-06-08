import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/queryClient";
import "shared-design-tokens/tokens.css";
import "./styles.css";

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
