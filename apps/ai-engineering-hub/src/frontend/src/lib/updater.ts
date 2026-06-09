// Self-update check. Runs only inside the packaged Tauri shell (no-op in the browser).
// Sets update state in updateStore so the UpdateBanner and Settings page can react.
// Tauri-only modules are dynamically imported so the browser bundle never loads them.
import { updateStore } from "./updateStore";
import { notify } from "./notify";

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function checkForUpdates(silent = true): Promise<void> {
  if (!inTauri()) return;
  updateStore.setState((s) => ({ ...s, checking: true, error: null }));
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    updateStore.setState((s) => ({ ...s, checking: false, lastChecked: Date.now() }));
    if (!update) return;

    updateStore.setState((s) => ({
      ...s,
      dismissed: false,
      pending: {
        version: update.version,
        body: update.body ?? null,
        install: async () => {
          await update.downloadAndInstall();
          await notify("Update installed", "AI Engineering Hub will now restart.");
          const { relaunch } = await import("@tauri-apps/plugin-process");
          await relaunch();
        },
      },
    }));

    if (!silent) {
      await notify(
        "AI Engineering Hub update available",
        `Version ${update.version} is ready to install.`,
      );
    }
  } catch (err) {
    updateStore.setState((s) => ({
      ...s,
      checking: false,
      error: String((err as Error)?.message ?? err),
    }));
    if (!silent) console.warn("update check failed:", err);
  }
}
