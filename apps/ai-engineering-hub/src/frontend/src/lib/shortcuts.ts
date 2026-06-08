// Register global keyboard shortcuts via plugin-global-shortcut.
// CmdOrCtrl+Shift+H toggles the main window visibility.
function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function registerGlobalShortcuts(): Promise<void> {
  if (!inTauri()) return;
  try {
    const { register } = await import("@tauri-apps/plugin-global-shortcut");
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await register("CmdOrCtrl+Shift+H", async () => {
      const win = getCurrentWindow();
      const visible = await win.isVisible();
      if (visible) {
        await win.hide();
      } else {
        await win.show();
        await win.setFocus();
      }
    });
  } catch {
    // global shortcuts require accessibility permissions on some platforms —
    // fail silently so startup is never blocked
  }
}

export async function unregisterGlobalShortcuts(): Promise<void> {
  if (!inTauri()) return;
  try {
    const { unregisterAll } = await import("@tauri-apps/plugin-global-shortcut");
    await unregisterAll();
  } catch {
    // ignore
  }
}
