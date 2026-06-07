use axum::{
    routing::get,
    Router,
    Json,
    response::IntoResponse,
};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;
use serde_json::json;

mod routes;
mod ws;

use ws::WsState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    // Create shared WebSocket state
    let ws_state = WsState::new();

    // Build the app
    let app = Router::<WsState>::new()
        .route("/", get(root_handler))
        .merge(routes::router::<WsState>())
        .route("/ws/metrics", get(ws::ws_handler))
        .with_state(ws_state);

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