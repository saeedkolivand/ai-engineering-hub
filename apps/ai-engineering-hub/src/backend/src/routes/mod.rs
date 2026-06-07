pub mod api;
pub mod ws;

use axum::Router;
use std::sync::Arc;
use crate::db::AppState;

/// Base router for non‑API routes (WebSocket, health, etc.)
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .merge(ws::router())
}

/// Export the API router so main can merge it
pub use api::api_router;