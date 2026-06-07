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

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    // Initialize database
    let pool = db::init_db().await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;
    tracing::info!("Database migrations applied successfully");

    // Create broadcast channel for WebSocket events
    let (tx, _) = broadcast::channel::<Value>(128);

    // Create shared state
    let app_state = Arc::new(AppState { pool, tx });
    // Start metrics collector watcher
    let metrics_dir = std::env::current_dir()?.join("metrics");
    let _collector_handle = tokio::spawn(async move {
        let _ = collector::start_watcher(app_state.clone(), metrics_dir).await;
    });

    // Build the app
    let app = Router::new()
        .route("/", get(root_handler))
        .merge(routes::router())
        .merge(routes::api_router())
        .route("/ws/metrics", get(ws::ws_handler))
        .with_state(app_state);

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("AI Engineering Hub starting on {}", addr);
    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn root_handler() -> impl IntoResponse {
    Json(json!({ "message": "AI Engineering Hub Backend" }))
}