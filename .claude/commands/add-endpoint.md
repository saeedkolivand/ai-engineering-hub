---
description: Add a Hub API endpoint (contract → Axum route → Tauri command → SDK → hook)
argument-hint: <endpoint purpose>
---

Add endpoint: **$ARGUMENTS**

Follow the **New API endpoint** checklist with `rust-backend-architect` + `contracts-architect`:
1. `packages/shared-api-contracts` — request/response shape.
2. `src-tauri/src/routes/` — Axum handler (validate input; bind stays `127.0.0.1`).
3. mirror as a Tauri command if the UI needs IPC.
4. `packages/shared-sdk` — typed method.
5. frontend — TanStack Query hook.
6. Build green → `/review-contracts` + `/review-backend` → `/update-graph`.
