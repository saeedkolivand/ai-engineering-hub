---
description: Focused React/TanStack renderer review with tanstack-frontend-expert (Primary Owner)
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **frontend** review.

1. Load `token-efficiency` + `frontend-standards`.
2. Scope with graphify; target = `$ARGUMENTS` else current `git diff`.
3. Read `design/information_architecture.md` + `design/ux_flows.md` before source.
4. Engage `tanstack-frontend-expert` (Primary); add `design-system-steward` as Secondary for styling. Verify: route loaders/error-boundaries/code-split, tables-first, drill-down, tokens-only, no deprecated TanStack pkgs, no mock data.
5. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
