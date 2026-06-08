---
name: review-workflow
description: How to run an explicit review for this project — pick the owning agent, keep ≤3 reviewers, severity rubric, what blocks. Load before any /review-* command.
---

# Review workflow (explicit, not auto-routed)

This project invokes reviewers **explicitly** (see the CLAUDE.md explicit-use map). There is no auto Stop-gate.

## Procedure
1. Identify the touched bounded context → its **Primary Owner** agent (CLAUDE.md map).
2. Load `token-efficiency` + the owner's standards skill. Scope with graphify; read the relevant `design/` doc. Stop at ~90% confidence.
3. Engage the Primary Owner over the target (`$ARGUMENTS` or current `git diff`). Add a Secondary (`tauri-security-reviewer` and/or `performance-profiler`) **only** if risk-bearing. **≤3 reviewers total.**
4. Reviewers are **read-only**; orchestrate from the main session (agents don't call agents).

## Severity & blocking
`SEVERITY · file:line · finding · one-line fix`. **Only HIGH/CRITICAL block**; LOW/MEDIUM are advisory.
- CRITICAL: data loss/corruption, forbidden tech (sidecar/Node service), exploitable security, plugin reading logs/SQLite/analytics, server that never starts.
- HIGH: architecture-rule violation, hardcoded tool enum, mock/`unimplemented!()` in committed code, missing route loader/error-boundary, TS↔Rust contract drift, deprecated TanStack pkg.

## Close out
Resolve HIGH/CRITICAL → build green → `/update-docs` (if docs drift) → `/update-graph`.
