#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::broadcast;
use serde_json::Value;
use anyhow::Result;
use sqlx::sqlite::SqlitePool;
use tracing_subscriber::EnvFilter;

mod db;
mod repository;
mod collector;
mod ws;

// Re-export AppState from db module
use db::AppState;

/// Initialize the Tauri application
fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    // Build the Tauri application
    tauri::Builder::default()
        .setup(|app| {
            // Clone the app handle to move into async task
            let app_handle = app.handle();

            // Initialize DB (async block)
            let fut = async move {
                // Use the same init_db from the original backend
                let pool = db::init_db().await?;
                let (tx, _) = broadcast::channel::<Value>(100);
                let state = Arc::new(AppState { pool, tx });

                // Store the state for later command access
                app_handle.manage(state.clone());

                // Start background collector
                let collector_state = state.clone();
                tauri::async_runtime::spawn(async move {
                    let metrics_dir = std::path::PathBuf::from("metrics");
                    if metrics_dir.exists() {
                        let _ = collector::start_watcher(collector_state, metrics_dir).await;
                    } else {
                        tracing::warn!("metrics/ directory not found, collector not started");
                    }
                });

                // Emit a "ready" event (optional)
                app_handle.emit_all("app-ready", "").ok();

                Ok::<(), anyhow::Error>(())
            };
            // Run the async initializer
            tauri::async_runtime::block_on(fut)
        })
        // Register Tauri commands (converted from Axum handlers)
    .invoke_handler(tauri::generate_handler![
        list_repositories,
        list_sessions,
        list_tasks,
        list_agents,
        list_metrics,
        analytics,
        list_settings,
        update_settings
    ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ========================
// Tauri Commands (converted from Axum API)
// ========================

#[tauri::command]
async fn list_repositories(state: State<'_, Arc<AppState>>) -> Result<Value, String> {
    repository::list_repositories(&state.pool)
        .await
        .map(|repos| serde_json::json!({ "repositories": repos }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_sessions(state: State<'_, Arc<AppState>>) -> Result<Value, String> {
    repository::list_sessions(&state.pool)
        .await
        .map(|sessions| serde_json::json!({ "sessions": sessions }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_tasks(state: State<'_, Arc<AppState>>) -> Result<Value, String> {
    repository::list_tasks(&state.pool)
        .await
        .map(|tasks| serde_json::json!({ "tasks": tasks }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_agents(state: State<'_, Arc<AppState>>) -> Result<Value, String> {
    repository::list_agents(&state.pool)
        .await
        .map(|agents| serde_json::json!({ "agents": agents }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_metrics(state: State<'_, Arc<AppState>>) -> Result<Value, String> {
    repository::list_metrics(&state.pool)
        .await
        .map(|metrics| serde_json::json!({ "metrics": metrics }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn analytics(state: State<'_, Arc<AppState>>) -> Result<Value, String> {
    let token_metrics = serde_json::json!({
        "daily": repository::get_token_usage_by_day(&state.pool).await.unwrap_or(0),
        "weekly": repository::get_token_usage_by_week(&state.pool).await.unwrap_or(0),
        "monthly": repository::get_token_usage_by_month(&state.pool).await.unwrap_or(0),
    });
    let savings = serde_json::json!({
        "total": repository::get_total_savings(&state.pool).await.unwrap_or(0),
    });
    Ok(serde_json::json!({ "token_metrics": token_metrics, "savings": savings }))
}

// Settings commands
#[tauri::command]
async fn list_settings(state: State<'_, Arc<AppState>>) -> Result<Value, String> {
    // Placeholder: return static settings; replace with DB logic as needed
    Ok(serde_json::json!({
        "theme": "light",
        "apiEndpoint": "",
        "enableTelemetry": false
    }))
}

#[tauri::command]
async fn update_settings(state: State<'_, Arc<AppState>>, settings: Value) -> Result<Value, String> {
    // Placeholder: accept settings and echo back; persist to DB if needed
    Ok(settings)
}

// ========================
// Event Emission (replaces WebSocket)
// ========================

/// This function can be called from the collector to emit metric updates.
/// The collector will use the broadcast channel; we listen to it here and forward
/// to the frontend via Tauri events.
pub fn start_metric_event_listener(app_handle: tauri::AppHandle, rx: broadcast::Receiver<Value>) {
    tauri::async_runtime::spawn(async move {
        let mut rx = rx;
        while let Ok(msg) = rx.recv().await {
            let payload = serde_json::to_string(&msg).unwrap_or_default();
            // Emit to all windows; front‑end can listen on `metrics-update`
            let _ = app_handle.emit_all("metrics-update", payload);
        }
    });
}