---
description: Sync docs/design artifacts/knowledge with project-steward (sole docs writer)
argument-hint: [area — defaults to the current diff]
---

Update docs for: **$ARGUMENTS** (else the current `git diff`).

With `project-steward`:
1. Identify stale/missing docs in `docs/` and `design/` for the change.
2. Update as **thin pointers** into source (no copied literals). Cover gaps: `docs/database.md`, `docs/deployment.md`, `docs/design-system.md`, `design/component_architecture.md`.
3. Keep API docs matching real endpoints.
4. Finish with `/update-graph`.
