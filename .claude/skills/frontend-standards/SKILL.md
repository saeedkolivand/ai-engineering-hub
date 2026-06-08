---
name: frontend-standards
description: React + TanStack renderer standards — Router (loaders/error-boundaries/code-split), Query, Table (tables-first), Virtual, Form, Store, three-panel layout, drill-down, command palette. Load for changes under apps/ai-engineering-hub/src/frontend/**.
---

# Frontend standards

Authoritative: `design/information_architecture.md` + `design/ux_flows.md`.

## Hard rules (HIGH if violated)
- **TanStack only**: Router / Query / Table / Virtual / Form / Store. **No `@tanstack/start`, no `@tanstack/config`.**
- **Complete routes**: every route has a loader (Query prefetch), an error boundary, and is code-split (lazy).
- **Remote data via Query hooks** — never `useState + useEffect` fetching. Domain selection state via **Store**.
- **Tables-first**: analytics/lists are TanStack Table (sort/filter/group/global-search/column-visibility) on live data; Virtual for big lists. Cards only for single-entity summaries.
- **Tokens-only**: consume `shared-design-tokens`; no raw hex/inline style values.
- **Contracts imported** from `packages/shared-*`; never redefined locally.
- **No mock data / invalid `:0` ports.**

## Structure
- 10-item left nav: Overview, Repositories, Sessions, Tasks, Agents, Retrieval, Analytics, Quality, Activity, Settings.
- RightPanel shows real selected-entity metadata/related/quick-actions/drill-down.
- Ctrl+K command palette searches real data (repos/sessions/tasks/agents) + navigates.
- Drill-down: Repository → Session → Task → Agent → Intervention → Metric via nested `$id` routes.
