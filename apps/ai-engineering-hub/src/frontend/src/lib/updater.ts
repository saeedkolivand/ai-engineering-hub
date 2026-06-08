//! Self-update check. Runs only inside the packaged Tauri shell (no-op in the browser).
//! On startup it asks the configured release endpoint for a newer, signed build and, with the
//! user's consent, downloads, installs, and relaunches. Tauri-only modules are dynamically
//! imported so the browser bundle never loads them.
function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function checkForUpdates(): Promise<void> {
  if (!inTauri()) return;
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update) return;

    const proceed = window.confirm(
      `A new version (${update.version}) is available.\n\n` +
        `${update.body ?? ""}\n\nDownload and install now? The app will restart.`,
    );
    if (!proceed) return;

    await update.downloadAndInstall();
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  } catch (err) {
    // Never block startup on update failures.
    console.warn("update check failed:", err);
  }
}
