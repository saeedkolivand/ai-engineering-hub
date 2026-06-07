use axum::{
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;
use serde_json::{json, Value};
use tokio::sync::broadcast;

mod routes;
mod ws;
mod models;
mod repository;
pub mod db;

use db::AppState;
mod collector;

use tauri::Manager;

#[tauri::command]
async fn start_backend(state: tauri::State<'_, db::AppState>) -> Result<(), String> {
    // The backend is already running; this is a placeholder for future commands.
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(db::init_db_blocking())
        .invoke_handler(tauri::generate_handler![start_backend])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn root_handler() -> impl IntoResponse {
    Json(json!({ "message": "AI Engineering Hub Backend" }))
}