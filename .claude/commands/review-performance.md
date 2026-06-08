---
description: Performance review with performance-profiler
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **performance** review.

1. Load `token-efficiency` + `backend-standards`/`frontend-standards`.
2. Target = `$ARGUMENTS` else current `git diff`.
3. Engage `performance-profiler` (Primary). Focus: startup <2s (no blocking init), indexed/paginated SQLite (no `raw_events` full scans), bounded memory at millions of events, virtualization on large lists.
4. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
