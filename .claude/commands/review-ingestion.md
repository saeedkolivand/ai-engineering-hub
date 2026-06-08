---
description: Review the dynamic metrics-ingestion context with ingestion-source-expert
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **ingestion** review.

1. Load `token-efficiency` + `ingestion-standards`.
2. Scope with graphify; target = `$ARGUMENTS` else current `git diff`.
3. Read `design/event_contracts.md` + the `sources` migration + `src-tauri/src/ingestion/**`.
4. Engage `ingestion-source-expert` (Primary). Verify: sources stay data-driven (no hardcoded tool enum), the three ingestion paths are source-agnostic, auto-detect works, savings are capability-driven.
5. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
