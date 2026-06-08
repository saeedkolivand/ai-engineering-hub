---
description: Diagnose and fix a bug, then route to the owning reviewer
argument-hint: <bug description or issue#>
---

Fix: **$ARGUMENTS**

1. Load `token-efficiency`. Reproduce; locate root cause via graphify + targeted reads (not repo-wide).
2. Fix at the root cause, not the symptom. Keep the change minimal and within the owning bounded context.
3. Build green (`rtk cargo build --workspace` / `rtk pnpm -r build`).
4. Run the owning `/review-*` command; resolve HIGH/CRITICAL. Run `/update-graph`.
