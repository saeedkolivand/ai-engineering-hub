---
description: Author a SQLx/SQLite migration (forward-safe, reversible-or-guarded, indexed)
argument-hint: <schema change>
---

Migration: **$ARGUMENTS**

With `rust-backend-architect` + skill `backend-standards`:
1. New file in `src-tauri/src-tauri/migrations/` (timestamped). Keep the **single canonical schema**.
2. Forward-safe and reversible-or-guarded; never destructive without a guard.
3. Add indexes for any new hot query path; add a view if it serves analytics.
4. Update the Rust models + any affected query; keep `shared-types` in parity.
5. `rtk cargo build --workspace` (migrations apply) → `/review-backend` → `/update-graph`.
