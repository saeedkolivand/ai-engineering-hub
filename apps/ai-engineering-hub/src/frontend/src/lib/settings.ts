// Tauri Store-backed persistent settings. Falls back gracefully outside Tauri.
// Theme preference is also mirrored to localStorage so initTheme() can read it
// synchronously on startup before the store promise resolves.
import type { ThemePref } from "./theme";

export interface AppSettings {
  theme: ThemePref;
  autostart: boolean;
  notifications: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  autostart: false,
  notifications: true,
};

const STORE_FILE = "settings.json";
const STORE_KEY = "settings";
const LS_KEY = "aeh.settings"; // kept in sync so theme.ts reads it synchronously

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let _store: Promise<import("@tauri-apps/plugin-store").Store | null> | null = null;

function store(): Promise<import("@tauri-apps/plugin-store").Store | null> {
  if (!_store) {
    _store = inTauri()
      ? import("@tauri-apps/plugin-store")
          .then(({ Store }) => Store.load(STORE_FILE, { defaults: {}, autoSave: true }))
          .catch(() => null)
      : Promise.resolve(null);
  }
  return _store;
}

export async function getSettings(): Promise<AppSettings> {
  const s = await store();
  if (s) {
    const saved = (await s.get<Partial<AppSettings>>(STORE_KEY)) ?? {};
    return { ...DEFAULT_SETTINGS, ...saved };
  }
  // localStorage fallback (browser / dev)
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  const s = await store();
  if (s) {
    await s.set(STORE_KEY, next);
  }
  // Keep localStorage in sync so theme.ts can do a sync read on startup.
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
