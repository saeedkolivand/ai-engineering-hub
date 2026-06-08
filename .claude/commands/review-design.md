---
description: Design-system/token-usage review with design-system-steward
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **design-system** review.

1. Load `token-efficiency` + `design-system`.
2. Target = `$ARGUMENTS` else current `git diff`.
3. Read `design/DESIGN-apple.md` + `packages/shared-design-tokens/src`.
4. Engage `design-system-steward` (Primary). Verify: tokens-only (no raw hex), single accent, no shadows on chrome, no decorative gradients, correct type ramp for density, on-scale radius/spacing.
5. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
