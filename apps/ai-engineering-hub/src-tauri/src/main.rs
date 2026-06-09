//! Tauri v2 desktop shell. It owns the single process and spawns the Hub's Axum
//! HTTP/WebSocket server (from `aeh-core`) inside it — no sidecars, no extra binaries.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
use tauri::menu::Submenu;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

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

            // ── System tray ──────────────────────────────────────────────────────────
            let show = MenuItem::with_id(app, "show", "Show Dashboard", true, None::<&str>)?;
            let check_update = MenuItem::with_id(
                app,
                "check_update",
                "Check for Updates…",
                true,
                None::<&str>,
            )?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show, &sep1, &check_update, &sep2, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("AI Engineering Hub")
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        show_main_window(tray.app_handle());
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "check_update" => {
                        // Signal the frontend to run the updater flow.
                        let _ = app.emit("menu:check-for-updates", ());
                        show_main_window(app);
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            // ── macOS native menu bar ─────────────────────────────────────────────────
            #[cfg(target_os = "macos")]
            {
                // App menu
                let about = PredefinedMenuItem::about(app, Some("About AI Engineering Hub"), None)?;
                let services = PredefinedMenuItem::services(app, None)?;
                let hide = PredefinedMenuItem::hide(app, None)?;
                let hide_others = PredefinedMenuItem::hide_others(app, None)?;
                let show_all = PredefinedMenuItem::show_all(app, None)?;
                let quit_native = PredefinedMenuItem::quit(app, Some("Quit AI Engineering Hub"))?;
                let app_menu = Submenu::with_items(
                    app,
                    "AI Engineering Hub",
                    true,
                    &[
                        &about,
                        &PredefinedMenuItem::separator(app)?,
                        &services,
                        &PredefinedMenuItem::separator(app)?,
                        &hide,
                        &hide_others,
                        &show_all,
                        &PredefinedMenuItem::separator(app)?,
                        &quit_native,
                    ],
                )?;

                // Edit menu
                let edit_menu = Submenu::with_items(
                    app,
                    "Edit",
                    true,
                    &[
                        &PredefinedMenuItem::undo(app, None)?,
                        &PredefinedMenuItem::redo(app, None)?,
                        &PredefinedMenuItem::separator(app)?,
                        &PredefinedMenuItem::cut(app, None)?,
                        &PredefinedMenuItem::copy(app, None)?,
                        &PredefinedMenuItem::paste(app, None)?,
                        &PredefinedMenuItem::separator(app)?,
                        &PredefinedMenuItem::select_all(app, None)?,
                    ],
                )?;

                // Window menu
                let window_menu = Submenu::with_items(
                    app,
                    "Window",
                    true,
                    &[
                        &PredefinedMenuItem::minimize(app, None)?,
                        &PredefinedMenuItem::maximize(app, None)?,
                        &PredefinedMenuItem::fullscreen(app, None)?,
                        &PredefinedMenuItem::separator(app)?,
                        &PredefinedMenuItem::close_window(app, None)?,
                    ],
                )?;

                let menu_bar = Menu::with_items(app, &[&app_menu, &edit_menu, &window_menu])?;
                app.set_menu(menu_bar)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the AI Engineering Hub");
}
