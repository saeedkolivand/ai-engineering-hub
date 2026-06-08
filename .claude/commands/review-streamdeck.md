---
description: Stream Deck plugin review with streamdeck-plugin-expert
argument-hint: [files or PR# — defaults to current git diff]
---

Run a focused **Stream Deck plugin** review.

1. Load `token-efficiency` + `streamdeck-standards`.
2. Target = `$ARGUMENTS` else current `git diff`.
3. Read `design/stream_deck_architecture.md` + `apps/streamdeck-plugin/**`.
4. Engage `streamdeck-plugin-expert` (Primary). Verify: real Elgato manifest/actions, **no log parsing / SQLite / analytics** (CRITICAL if present), Hub-only via `shared-sdk`, all 9 monitors incl. Context Health.
5. Report `SEVERITY · file:line · finding · fix`; **HIGH/CRITICAL block**.
