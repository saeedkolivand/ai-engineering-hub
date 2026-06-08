use tauri::{Api, Manager, RunEvent, Window};
use tokio::sync::broadcast::{channel, Sender};
use sqlx::SqlitePool;
use serde_json::Value;
use crate::repository::{get_token_usage_by_day, get_token_usage_by_week, get_token_usage_by_month, get_total_savings, get_productivity_metrics, get_quality_metrics, get_retrieval_metrics};
use crate::collector::start_collector;

mod repository;
mod collector;

/// Represents the application state, including the database pool and event broadcaster.
struct AppState {
    pool: SqlitePool,
    tx: Sender<Value>,
}

#[tokio::main]
async fn main() {
    // Initialize the SQLite database connection pool
    let pool = SqlitePool::connect("sqlite:./db.sqlite").await.expect("Failed to connect to database");

    // Set up a broadcast channel for event handling
    let (tx, rx) = channel(100);

    // Start the metrics collector in a separate task
    tokio::spawn(async move {
        start_collector(pool.clone(), rx).await.expect("Failed to start collector");
    });

    // Build and run the Tauri application
    tauri::Builder::default()
        .setup(move |app| {
            // Initialize the application state with the database pool and event broadcaster
            app.manage(AppState {
                pool: pool.clone(),
                tx: tx.clone(),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_event,
            get_token_usage_by_day,
            get_token_usage_by_week,
            get_token_usage_by_month,
            get_total_savings,
            get_productivity_metrics,
            get_quality_metrics,
            get_retrieval_metrics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Sends an event to the metrics collector.
#[tauri::command]
async fn send_event(state: tauri::State<'_, AppState>, event_type: String, payload: Value) -> Result<(), String> {
    let event = serde_json::json!({
        "type": event_type,
        "payload": payload
    });

    state.tx.send(event).map_err(|e| e.to_string())?;

    Ok(())
}

/// Fetches daily token usage metrics.
#[tauri::command]
async fn get_token_usage_by_day(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    let pool = &state.pool;
    let result = get_token_usage_by_day(pool).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

/// Fetches weekly token usage metrics.
#[tauri::command]
async fn get_token_usage_by_week(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    let pool = &state.pool;
    let result = get_token_usage_by_week(pool).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

/// Fetches monthly token usage metrics.
#[tauri::command]
async fn get_token_usage_by_month(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    let pool = &state.pool;
    let result = get_token_usage_by_month(pool).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

/// Fetches total savings metrics.
#[tauri::command]
async fn get_total_savings(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    let pool = &state.pool;
    let result = get_total_savings(pool).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

/// Fetches productivity metrics.
#[tauri::command]
async fn get_productivity_metrics(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    let pool = &state.pool;
    let result = get_productivity_metrics(pool).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

/// Fetches quality metrics.
#[tauri::command]
async fn get_quality_metrics(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    let pool = &state.pool;
    let result = get_quality_metrics(pool).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

/// Fetches retrieval metrics.
#[tauri::command]
async fn get_retrieval_metrics(state: tauri::State<'_, AppState>) -> Result<Value, String> {
    let pool = &state.pool;
    let result = get_retrieval_metrics(pool).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}