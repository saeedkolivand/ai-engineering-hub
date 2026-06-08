---
name: design-system
description: Apple-derived design-token standards at operational density — single accent, SF Pro/Inter ladder, radius/spacing scales, one-shadow restraint, scale(0.95) press. Load for styling/token changes.
---

# Design system

Authoritative: `design/DESIGN-apple.md` + `packages/shared-design-tokens`.

## The synthesis: Apple primitives, operational density
- **Single accent** — Action Blue `#0066cc` for all interactive elements; `#0071e3` focus ring; `#2997ff` links on dark. No second brand accent. Status colors (success/warn/error/info) are a muted operational layer for metric/build state only.
- **Type** — SF Pro Display/Text (`system-ui, -apple-system`) + Inter fallback; ladder 300/400/600/700 (no 500); negative tracking on display sizes. Large Apple sizes for hero/empty states; **dense 13–14px ramp** for tables/nav/right-panel/command-palette.
- **Radius** — `sm 8 / md 11 / lg 18 / pill 9999 / none 0`. One grammar.
- **Spacing** — 8px base (4/8/12/17/24/32/48/80) for marketing rhythm; tighter 4/6/8/12 for dense surfaces.
- **Elevation** — surface-color change + hairlines do the work. The one product shadow is for hero imagery only. A minimal functional set (one soft shadow + backdrop-blur) for overlays (command palette/dropdowns/popovers/sticky bars) — never on cards/tables/buttons.
- **Interaction** — `transform: scale(0.95)` press; 2px focus ring. Subtle row hover (background tint only) on tables.

## Don't
Raw hex in className/CSS · a second accent · shadows on chrome · decorative gradients · marketing low-density on operational surfaces.
