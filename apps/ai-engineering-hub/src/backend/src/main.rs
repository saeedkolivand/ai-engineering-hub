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
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    // Initialize the database and broadcast channel
    let pool = db::init_db()
        .await
        .expect("Failed to initialize database");
    let (tx, _) = broadcast::channel::<Value>(100);

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Migrations should run without error");

    let app_state = Arc::new(AppState {
        pool: pool.clone(),
        tx: tx.clone(),
    });

    // Start the metrics collector in background
    let collector_state = app_state.clone();
    tokio::spawn(async move {
        let metrics_dir = std::path::PathBuf::from("metrics");
        if metrics_dir.exists() {
            let _ = collector::start_watcher(collector_state, metrics_dir).await;
        } else {
            tracing::warn!("metrics/ directory not found, collector not started");
        }
    });

    // Build the full router: API routes + WebSocket route
    let app = Router::new()
        .route("/api/health", get(health_handler))
        .merge(routes::api::api_router())
        .merge(routes::router())
        .with_state(app_state.clone());

    // Start the HTTP server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("Starting HTTP server on {}", addr);
    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_handler() -> impl IntoResponse {
    Json(json!({ "message": "AI Engineering Hub Backend" }))
}