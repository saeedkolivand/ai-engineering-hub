---
description: Refactor a module without behavior change, then route to the owning reviewer
argument-hint: <module/path or area>
---

Refactor: **$ARGUMENTS**

1. Load `token-efficiency`. Map the module with graphify; confirm the seam and the bounded-context boundary.
2. Refactor without behavior change. Preserve contracts (`packages/shared-*`) and public signatures unless the task says otherwise.
3. Build green; diff should be behavior-preserving.
4. Run the owning `/review-*` command; resolve HIGH/CRITICAL. Run `/update-graph`.
