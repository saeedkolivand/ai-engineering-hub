---
description: Security review of risk-bearing changes with tauri-security-reviewer
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **security** review.

1. Load `token-efficiency` + `backend-standards`.
2. Target = `$ARGUMENTS` else current `git diff`.
3. Engage `tauri-security-reviewer` (Primary). Focus: Axum binds `127.0.0.1` only, ingestion/IPC input validation + body limits, least-privilege Tauri capabilities, file-watch path-traversal/symlink safety, no secret/PII leakage, updater signature intact.
4. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
