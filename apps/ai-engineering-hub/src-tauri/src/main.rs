//! Tauri v2 desktop shell. It owns the single process and spawns the Hub's Axum
//! HTTP/WebSocket server (from `aeh-core`) inside it — no sidecars, no extra binaries.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        // Registered for future use; all current DB access goes through the Hub's
        // Axum API (aeh-core / SQLx), not via this plugin.
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            // Resolve a writable DB path under the app data dir.
            let db_path = app
                .path()
                .app_data_dir()
                .map(|dir| {
                    let _ = std::fs::create_dir_all(&dir);
                    dir.join("hub.sqlite").to_string_lossy().replace('\\', "/")
                })
                .unwrap_or_else(|_| "hub.sqlite".to_string());

            // Spawn the Axum server inside the Tauri process.
            tauri::async_runtime::spawn(async move {
                if let Err(e) = aeh_core::run(&db_path, aeh_core::DEFAULT_PORT).await {
                    tracing::error!("hub server exited: {e}");
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the AI Engineering Hub");
}
