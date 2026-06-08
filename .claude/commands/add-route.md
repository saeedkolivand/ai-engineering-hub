---
description: Scaffold a TanStack route (loader + error boundary + code-split, drill-down aware)
argument-hint: <route path + purpose>
---

Add route: **$ARGUMENTS**

With `tanstack-frontend-expert` + skill `frontend-standards`:
1. File-based route under `src/frontend/src/routes/` (`$id` segment for detail/drill-down).
2. Add a **loader** (TanStack Query prefetch), a **route error boundary**, and **lazy** the component (code-split).
3. Wire into the drill-down chain (Repository → Session → Task → Agent → Intervention → Metric) and link from the parent table.
4. Tokens-only styling; tables-first content; import contracts from `packages/shared-*`.
5. Build green → `/review-frontend` → `/update-graph`.
