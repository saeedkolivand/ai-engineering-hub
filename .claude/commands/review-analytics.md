---
description: Review analytics + repository intelligence with analytics-engine-expert
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **analytics** review.

1. Load `token-efficiency` + `analytics-standards`.
2. Scope with graphify; target = `$ARGUMENTS` else current `git diff`.
3. Read `src-tauri/src/analytics/**` + `src-tauri/src/intelligence/**` + relevant views/indexes.
4. Engage `analytics-engine-expert` (Primary); add `performance-profiler` as Secondary for hot aggregations. Verify: dimensional `group_by`, correct rates with divide-by-zero guards, no mock numbers, indexed queries.
5. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
