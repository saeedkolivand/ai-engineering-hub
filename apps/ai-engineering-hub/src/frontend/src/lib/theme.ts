//! Theme preference: light / dark / system. Applies a resolved `data-theme` to <html>
//! (CSS in shared-design-tokens/tokens.css does the rest), persists to the shared
//! settings key, and tracks the OS preference while in "system" mode.
export type ThemePref = "system" | "light" | "dark";

const LS_KEY = "aeh.settings"; // shared with the Settings form
const DARK = "(prefers-color-scheme: dark)";

export function getThemePref(): ThemePref {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}").theme;
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function resolve(pref: ThemePref): "light" | "dark" {
  if (pref === "system") {
    return window.matchMedia(DARK).matches ? "dark" : "light";
  }
  return pref;
}

/** Apply a preference to the document (does not persist). */
export function applyTheme(pref: ThemePref): void {
  document.documentElement.dataset.theme = resolve(pref);
}

/** Persist a preference and apply it immediately. */
export function setThemePref(pref: ThemePref): void {
  try {
    const cur = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
    localStorage.setItem(LS_KEY, JSON.stringify({ ...cur, theme: pref }));
  } catch {
    localStorage.setItem(LS_KEY, JSON.stringify({ theme: pref }));
  }
  applyTheme(pref);
}

/** Apply the saved preference on startup and keep "system" in sync with the OS. */
export function initTheme(): void {
  applyTheme(getThemePref());
  window
    .matchMedia(DARK)
    .addEventListener("change", () => {
      if (getThemePref() === "system") applyTheme("system");
    });
}
