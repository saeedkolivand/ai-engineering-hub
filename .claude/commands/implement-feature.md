---
description: Implement a feature end-to-end, then route to the owning reviewer(s)
argument-hint: <feature description>
---

Implement: **$ARGUMENTS**

1. Load `token-efficiency`. Scope with graphify; read the relevant `design/` doc + existing patterns. Stop at ~90% confidence.
2. Identify the bounded context(s) touched and the owning agent(s) from the CLAUDE.md explicit-use map.
3. Implement following the matching standards skill(s). Reuse existing utilities; import contracts from `packages/shared-*` (never redefine). No mock data.
4. If new capability, follow the relevant CLAUDE.md checklist (metric/source/endpoint/route/monitor).
5. Build green: `rtk cargo build --workspace` and/or `rtk pnpm -r build`.
6. Run the owning `/review-*` command. Resolve HIGH/CRITICAL.
7. Run `/update-graph`.
