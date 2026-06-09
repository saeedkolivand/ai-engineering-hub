// Apple-derived design tokens at operational density.
// Apple's primitives + restraint (single accent, SF Pro ladder, one-shadow rule,
// scale(0.95) press, surface-as-divider) with a dense UI ramp for tables/chrome.
// See design/DESIGN-apple.md. Import ./tokens.css for the CSS custom properties.

export const color = {
  // Single interactive accent — the ONLY "click me" color.
  accent: "#0066cc",
  accentFocus: "#0071e3",
  accentOnDark: "#2997ff",
  // Ink / surfaces
  ink: "#1d1d1f",
  inkMuted: "#333333",
  inkFaint: "#7a7a7a",
  canvas: "#ffffff",
  parchment: "#f5f5f7",
  pearl: "#fafafc",
  hairline: "#e0e0e0",
  dividerSoft: "#f0f0f0",
  // Near-black operational surfaces (dense dark chrome)
  surface1: "#272729",
  surface2: "#2a2a2c",
  surface3: "#252527",
  black: "#000000",
  onDark: "#ffffff",
  onDarkMuted: "#cccccc",
  // Muted operational status layer (metrics/build state only — NOT a second brand accent).
  success: "#2c7a3f",
  warn: "#9a6700",
  error: "#b3261e",
  info: "#0066cc",
} as const;

export const font = {
  display: 'SF Pro Display, system-ui, -apple-system, "Inter", sans-serif',
  text: 'SF Pro Text, system-ui, -apple-system, "Inter", sans-serif',
  mono: 'ui-monospace, "SF Mono", "JetBrains Mono", monospace',
} as const;

export const weight = { light: 300, regular: 400, semibold: 600, bold: 700 } as const;

// Two ramps: large Apple sizes for hero/empty states; dense ramp for operational UI.
export const fontSize = {
  hero: "56px",
  displayLg: "40px",
  lead: "28px",
  tagline: "21px",
  body: "17px",
  // Dense operational ramp (tables, nav, right panel, command palette)
  uiLg: "14px",
  ui: "13px",
  uiSm: "12px",
  micro: "11px",
  metric: "22px",
} as const;

export const radius = {
  none: "0px",
  xs: "5px",
  sm: "8px",
  md: "11px",
  lg: "18px",
  pill: "9999px",
} as const;

export const space = {
  // 8px marketing rhythm
  xxs: "4px",
  xs: "8px",
  sm: "12px",
  md: "17px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  section: "80px",
  // dense table/row scale
  row: "6px",
  cell: "8px",
} as const;

export const elevation = {
  // The single product shadow — hero imagery only.
  product: "rgba(0,0,0,0.22) 3px 5px 30px 0",
  // Minimal functional elevation for transient overlays (palette/dropdowns/popovers).
  overlay: "0 8px 24px rgba(0,0,0,0.16)",
  hairline: "0 0 0 1px #e0e0e0",
} as const;

export const motion = {
  press: "scale(0.95)",
  focusRing: `0 0 0 2px ${color.accentFocus}`,
} as const;

export const layout = {
  topbarH: "var(--topbar-h)",
  titlebarH: "var(--titlebar-h)",
  sidebarW: "var(--sidebar-w)",
  rightpanelW: "var(--rightpanel-w)",
} as const;

export const tokens = { color, font, weight, fontSize, radius, space, elevation, motion, layout } as const;
export type Tokens = typeof tokens;
