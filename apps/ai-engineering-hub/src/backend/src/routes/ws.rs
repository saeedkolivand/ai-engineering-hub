use axum::{Router, routing::get, extract::State, response::IntoResponse, Json};
use std::sync::Arc;
use crate::db::AppState;
use crate::ws;

/// WebSocket router – exposes `/ws/metrics` for real-time metric streaming
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/ws/health", get(health_handler))
        .route("/ws/metrics", get(ws::ws_handler))
}

async fn health_handler(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}