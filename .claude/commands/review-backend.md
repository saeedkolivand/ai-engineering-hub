---
description: Focused Rust/Tauri/Axum backend review with rust-backend-architect (Primary Owner)
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **Rust backend** review.

1. Load the `token-efficiency` + `backend-standards` skills.
2. Scope with graphify (`graphify explain "rust backend architecture"`) — no repo-wide scan.
3. Target = `$ARGUMENTS` if given, else the current `git diff`.
4. Read `design/domain_model.md` + `design/database_schema.md` before source; stop at ~90% confidence.
5. Engage **only** `rust-backend-architect` as Primary Owner. Add `tauri-security-reviewer` and/or `performance-profiler` as Secondary **only** if risk-bearing — ≤3 reviewers total.
6. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
