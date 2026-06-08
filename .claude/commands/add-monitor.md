---
description: Add a Stream Deck monitor (Hub-only via shared-sdk; no logs/SQLite/analytics)
argument-hint: <monitor name + which Hub metric>
---

Add monitor: **$ARGUMENTS**

With `streamdeck-plugin-expert` + skill `streamdeck-standards`:
1. Register the action in the `*.sdPlugin/manifest.json` (UUID + property inspector).
2. Implement the monitor consuming the Hub via `shared-sdk` + `shared-events` only — **no log parsing, no SQLite, no analytics**.
3. Subscribe to the relevant WS event / poll the relevant endpoint; handle reconnect.
4. Tokens-only styling from `shared-design-tokens`.
5. Build green (`apps/streamdeck-plugin` build) → `/review-streamdeck` → `/update-graph`.
