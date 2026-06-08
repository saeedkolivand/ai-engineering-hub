# Apple Design Analysis (design language reference)

The visual reference for the Hub. We adopt Apple's **primitives and restraint** and apply
them at **operational density** (see [docs/design-system.md](../docs/design-system.md)).
Implemented as tokens in [packages/shared-design-tokens](../packages/shared-design-tokens).

## Principles
- Photography/content first; UI chrome recedes. One signature drop-shadow (product imagery
  only). No decorative gradients. Surface-color change is the section divider.
- A single interactive accent (Action Blue). Two button grammars: blue pill CTA + compact
  utility rect. `scale(0.95)` press micro-interaction. 2px focus ring.
- SF Pro Display/Text; negative letter-spacing at display sizes; weight ladder 300/400/600/700
  (500 absent). Body reads at 17px on marketing surfaces.

## Color
- Accent `#0066cc`; focus `#0071e3`; on-dark link `#2997ff`.
- Ink `#1d1d1f`; muted `#333` / `#7a7a7a`; canvas `#fff`; parchment `#f5f5f7`; pearl `#fafafc`;
  hairline `#e0e0e0`; soft divider `#f0f0f0`.
- Near-black tiles `#272729` / `#2a2a2c` / `#252527`; true black `#000`.

## Typography ramp (marketing)
hero 56 / display-lg 40 / lead 28 / tagline 21 / body 17 / caption 14 / fine 12, weights
600 for display, 400 for body, 300 for airy large reads.

## Radius
`none 0` (full-bleed) · `sm 8` (utility) · `md 11` (pearl capsule) · `lg 18` (cards) ·
`pill 9999` (CTAs, search, chips).

## Spacing
8px base: 4 / 8 / 12 / 17 / 24 / 32 / 48 / 80 (section).

## Components (grammar)
- `button-primary`: Action Blue pill, white text, 11×22.
- `button-dark-utility`: ink fill, `sm` radius, nav actions.
- `product-tile` (light/parchment/dark): full-bleed, edge-to-edge, color change = divider.
- `store-utility-card`: white, hairline border, `lg` radius, 24 padding.
- `search-input`: pill, 44 high.
- frosted sub-nav + floating sticky bar: parchment @ 80% + backdrop blur.

## Operational-density adaptation (our deviation)
The original is a marketing aesthetic; the Hub is a dense operational tool. We keep the
discipline above but add: a dense 13–14px UI type ramp (tables/nav/right-panel/palette),
tighter row spacing (4/6/8/12), muted status colors for metric/build state, a restrained
functional-elevation set for overlays, and a subtle table row hover. Large Apple sizes are
reserved for hero/empty/overview surfaces.
