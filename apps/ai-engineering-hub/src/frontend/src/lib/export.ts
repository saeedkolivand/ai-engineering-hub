// Export data to JSON via native save dialog (plugin-dialog + plugin-fs) in Tauri,
// falling back to a browser download outside Tauri.
export async function exportJson(data: unknown, defaultName: string): Promise<void> {
  const json = JSON.stringify(data, null, 2);

  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await save({
        defaultPath: defaultName,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (path) await writeTextFile(path, json);
      return;
    } catch {
      // fall through to browser download
    }
  }

  // Browser / dev fallback
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function openFileJson<T = unknown>(): Promise<T | null> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path || Array.isArray(path)) return null;
      const text = await readTextFile(path);
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }
  return null;
}
