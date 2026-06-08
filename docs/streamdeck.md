# Stream Deck Plugin

A real Elgato Stream Deck plugin (SDK v2) at [apps/streamdeck-plugin](../apps/streamdeck-plugin).
It is a separate app launched by the Stream Deck software; it consumes the Hub's local API via
[shared-sdk](../packages/shared-sdk) and **never** parses logs, accesses SQLite, or computes
analytics.

## Structure
```
com.aiengineering.monitor.sdPlugin/
  manifest.json     9 keypad actions (SDKVersion 2, Nodejs runtime)
  bin/plugin.js     bundled entry (tsup) — CodePath
  imgs/             icons (add before packaging)
src/
  plugin.ts         registers actions, streamDeck.connect()
  actions.ts        MetricMonitor base + 9 monitors
  hub.ts            shared-sdk HubClient (the only data path)
```

## Monitors (9)
Token · Savings · Agent · Task · Intervention · Productivity · Build Health · Retrieval ·
**Context Health**. Each is a `SingletonAction` that polls `GET /api/v1/analytics` via the
HubClient and renders a key title. Swap polling for the `/ws/events` stream by calling
`hub.connect(...)` for push updates.

## Build & install
```
cd apps/streamdeck-plugin
pnpm build                                                  # -> bin/plugin.js
pnpm dlx @elgato/cli link com.aiengineering.monitor.sdPlugin   # dev install
pnpm dlx @elgato/cli pack com.aiengineering.monitor.sdPlugin   # -> .streamDeckPlugin
```
Add icon assets under `com.aiengineering.monitor.sdPlugin/imgs/` (paths referenced by the
manifest). The Hub must be running (`http://127.0.0.1:47800`).

## Adding a monitor
Use `/add-monitor` (agent `streamdeck-plugin-expert`, skill `streamdeck-standards`): add an
action to `manifest.json` and a `MetricMonitor` subclass in `actions.ts`. Keep it Hub-only.
