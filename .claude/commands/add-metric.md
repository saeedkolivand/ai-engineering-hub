---
description: Add an analytics metric end-to-end (type → query → endpoint → contract → UI)
argument-hint: <metric name + definition>
---

Add metric: **$ARGUMENTS**

Follow the **New analytics metric** checklist with `analytics-engine-expert` + skill `analytics-standards`:
1. `packages/shared-types` — metric type (TS + Rust, in parity).
2. migration/view + indexes if needed.
3. `src-tauri/src/analytics/` — dimensional query (`group_by` source|provider|agent|repository), divide-by-zero guarded, no mock.
4. expose via Tauri command + Axum route.
5. `packages/shared-api-contracts` — request/response.
6. frontend: add as a TanStack Table column/view (tables-first).
7. Build green → `/review-analytics` → `/update-graph`.
