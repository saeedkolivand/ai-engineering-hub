---
description: Shared-contracts (TS↔Rust parity) review with contracts-architect
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **contracts** review.

1. Load `token-efficiency` + `contracts-parity`.
2. Target = `$ARGUMENTS` else current `git diff`.
3. Read `packages/shared-{types,events,api-contracts,sdk}/src` + `design/api_contracts.md`.
4. Engage `contracts-architect` (Primary). Verify: TS↔Rust parity, single source of truth (no locally-redefined contracts), every endpoint has a contract + `shared-sdk` method, dynamic-source contracts present.
5. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
