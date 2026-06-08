# Design System

Source of truth: [packages/shared-design-tokens](../packages/shared-design-tokens) — TS
tokens (`src/index.ts`) + CSS custom properties (`src/tokens.css`). Derived from
[design/DESIGN-apple.md](../design/DESIGN-apple.md).

## Philosophy: Apple primitives at operational density
We adopt Apple's restraint and primitives, then raise density for a Datadog/Linear-class tool
(the spec requires an operational tool, **not** a marketing site).

- **Single accent.** Action Blue `#0066cc` is the only interactive color (links, primary
  buttons, focus root); `#0071e3` focus ring; `#2997ff` on dark. No second brand accent.
  Status colors (success/warn/error/info) are a muted operational layer for metric/build
  state only.
- **Type.** SF Pro Display/Text (`system-ui, -apple-system`) + Inter fallback; weight ladder
  300/400/600/700 (no 500); negative tracking on display sizes. Two ramps: the large Apple
  sizes for hero/empty states, and a **dense 13–14px ramp** for tables/nav/right-panel/palette.
- **Radius.** `sm 8 / md 11 / lg 18 / pill 9999 / none 0`. One grammar.
- **Spacing.** 8px rhythm for marketing surfaces; tighter 4/6/8/12 for dense surfaces.
- **Elevation.** Surface-color change + hairlines do the work. The single product shadow is
  for hero imagery only; a minimal functional-elevation set (one soft shadow + backdrop blur)
  is reserved for transient overlays (command palette, dropdowns, sticky bars). Never on
  cards/tables/buttons.
- **Interaction.** `transform: scale(0.95)` press; 2px focus ring; subtle row hover (tint only).

## Consuming
```ts
import "shared-design-tokens/tokens.css"; // once at app root
import { color, fontSize, radius } from "shared-design-tokens";
```
In CSS use the variables (`var(--color-accent)`, `var(--fs-ui)`, `var(--radius-lg)`, …). Never
hardcode hex. The hub frontend ([styles.css](../apps/ai-engineering-hub/src/frontend/src/styles.css))
and the Stream Deck plugin both consume these tokens.

## Theming

The Hub supports **light / dark / system** themes. Light is the `:root` default; dark is a
`[data-theme="dark"]` token override in
[tokens.css](../packages/shared-design-tokens/src/tokens.css). The app sets `data-theme` on
`<html>`:

- The preference (`system` | `light` | `dark`) is stored in `localStorage` under `aeh.settings`
  and applied via [lib/theme.ts](../apps/ai-engineering-hub/src/frontend/src/lib/theme.ts).
- An inline script in `index.html` applies it **before first paint** (no flash).
- `system` resolves via `matchMedia('(prefers-color-scheme: dark)')` and updates live when the OS
  changes.
- Change it in **Settings → Theme** (applies instantly).

Because every surface uses the token variables, both themes — and the Stream Deck plugin — stay
consistent automatically. Status tints (`--color-success-bg`, …) are theme-aware so pills and
banners adapt.

## Component primitives

| Token group | Used by |
| --- | --- |
| `--color-accent` (+ focus/on-dark) | links, primary buttons, active nav, focus ring |
| `--color-canvas` / `parchment` / `pearl` | cards, app background, table headers |
| `--color-ink` / `ink-muted` / `ink-faint` | text hierarchy |
| `--fs-ui*` (13–14px ramp) | tables, nav, right panel, command palette |
| `--radius-*`, `--space-*` | one radius/spacing grammar across the app |
| `--elevation-overlay` | command palette, dropdowns, sticky bars (overlays only) |

Review token usage with `/review-design` (agent `design-system-steward`, skill `design-system`).
