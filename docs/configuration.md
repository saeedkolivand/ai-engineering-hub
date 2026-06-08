# Configuration

The Hub is intentionally low-config. The few knobs that exist:

## Network address

The API/WebSocket bind to a **fixed** `127.0.0.1:47800` (localhost only). The port is defined once
as `DEFAULT_PORT` in [core/src/state.rs](../apps/ai-engineering-hub/core/src/state.rs); the
frontend points at the same address via `HUB_BASE` in
[src/frontend/src/lib/hub.ts](../apps/ai-engineering-hub/src/frontend/src/lib/hub.ts). If you
change one, change both.

> Binding is localhost-only by design and is never exposed to the network. See
> [SECURITY.md](../SECURITY.md).

## Database location

| Context | File |
| --- | --- |
| Packaged app / `pnpm app:dev` | `hub.sqlite` in the OS app-data dir (resolved by Tauri) |
| Headless dev (`pnpm dev:hub`) | `hub-dev.sqlite` in the working directory |

Dev databases are disposable — delete `hub-dev.sqlite*` to reset. More in [Database](database.md).

## App settings (UI)

Settings are stored in the browser's `localStorage` under the key **`aeh.settings`**:

| Setting | Values | Notes |
| --- | --- | --- |
| `theme` | `system` \| `light` \| `dark` | Applied instantly; `system` follows the OS and updates live. See [Design system](design-system.md#theming). |
| `endpoint` | URL | The Hub API endpoint shown in Settings. |

## Integrations

Which tools are tracked is **data**, not config files — manage them under **Integrations** in the
app, or via `GET/POST /api/v1/sources`. Enabling a source starts its collector (5s poll). See
[Integrations](integrations.md).

## Environment variables

| Variable | Effect |
| --- | --- |
| `RUST_LOG` | `tracing` filter for the server/collectors, e.g. `RUST_LOG=info` or `RUST_LOG=aeh_core=debug`. |

## Versioning

The project stays in the **`0.x.x`** range permanently (the leading `0.` never changes): a major
change bumps the **second** segment, minor/patch the third. One command keeps every version field
in sync — see [Releasing](releasing.md).
