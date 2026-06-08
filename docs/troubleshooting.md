# Troubleshooting

## "Could not load. Failed to fetch / Is the Hub running?"

`pnpm dev` starts the **UI only**. The API lives inside the Tauri app. Either run the full app
(`pnpm app:dev`) or start the API alongside the UI:

```bash
pnpm dev:hub   # terminal 1 — Hub API on 127.0.0.1:47800
pnpm dev       # terminal 2 — Vite UI
```

## I enabled an integration but no data appears

- Enabling starts the collector on a **5-second poll** — give it a moment; backfill of large
  histories takes a few seconds.
- The tool must actually have **local data** on this machine. OpenCode sessions using a local
  model show 0 tokens (correctly). Gemini CLI only logs tokens if you opt into file telemetry.
- Graphify and CodeGraph are **index artifacts**, not event streams — they have no built-in
  collector; feed them via `POST /api/v1/ingest`. See [Integrations](integrations.md).

## Productivity / Quality widgets show "—"

That's expected and honest: **no connected tool reports** build/test/lint outcomes, first-pass
success, or intervention/retry counts. "—" means "not measured", not `0%`. They populate when a
source emits those fields (e.g. a CI reporter or `POST /api/v1/ingest`). See
[Analytics](analytics.md#the--semantics-important).

## `cargo tauri build` fails: `icon.ico not found`

App icons are committed under `src-tauri/icons/`. If you removed them, regenerate with
`pnpm tauri icon <path-to-1024px.png>`.

## Port 47800 already in use

Another Hub instance (or a stale `serve`/app process) is bound. Stop it, then retry. The address
is fixed — see [Configuration](configuration.md).

## Linux: `pnpm app:build` fails to find webkit2gtk

Install the Tauri Linux build dependencies:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

(The CI `app` job installs these automatically.)

## Stream Deck: plugin won't validate / package

Run `pnpm --filter ai-engineering-monitor-plugin run sd:validate` for the exact rule violations.
Common ones: `Version` must be 4-segment (`0.x.x.0`) and `Category` must match the plugin `Name`.
The plugin also needs the Hub running (`http://127.0.0.1:47800`). See [Stream Deck](streamdeck.md).

## Frontend type errors after changing a contract

The `packages/shared-*` types are the source of truth and must stay in **TS ↔ Rust parity**. After
editing a contract, run `pnpm --filter ai-engineering-hub-frontend exec tsc --noEmit`.

## Still stuck?

Search or open a [GitHub issue](https://github.com/saeedkolivand/ai-engineering-hub/issues), or
ask in [Discussions](https://github.com/saeedkolivand/ai-engineering-hub/discussions). Please
redact local paths/usernames from logs.
