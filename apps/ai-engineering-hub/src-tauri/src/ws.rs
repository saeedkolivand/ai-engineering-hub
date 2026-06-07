use axum::{
    extract::Extension,
    routing::{get, post},
    Router,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use tokio::sync::broadcast::Receiver;
use crate::db::AppState;
use crate::repository;
use serde_json::Value;
use futures::{StreamExt, sink::SinkExt};
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};

/// WebSocket handler that streams broadcasted metric events to connected clients.
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Extension(state): Extension<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    let mut rx: Receiver<Value> = state.tx.subscribe();

    // Forward broadcast messages to the client
    loop {
        tokio::select! {
            // Receive a message from the client (e.g., for subscription commands)
            client_msg = socket.recv() => {
                if let Some(Ok(msg)) = client_msg {
                    // Simple echo or ignore; real implementation would parse subscription actions
                    if let Message::Text(txt) = msg {
                        // For now just acknowledge
                        let _ = socket.send(Message::Text(format!(\"{{\\\"ack\\\": \\\"{}\\\"}}\", txt))).await;
                    }
                } else {
                    // Client disconnected
                    break;
                }
            }
            // Receive a broadcasted metric event
            broadcast_msg = rx.recv() => {
                match broadcast_msg {
                    Ok(event) => {
                        let payload = serde_json::to_string(&event).unwrap_or_default();
                        let _ = socket.send(Message::Text(payload)).await;
                    }
                    Err(_) => break,
                }
            }
        }
    }
}

/// REST handler wrappers that call repository functions and return JSON payloads.
async fn list_repositories_handler(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    repository::list_repositories(&state.pool)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn list_sessions_handler(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    repository::list_sessions(&state.pool)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn list_tasks_handler(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    repository::list_tasks(&state.pool)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn list_agents_handler(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    repository::list_agents(&state.pool)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn list_metrics_handler(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Value>, (StatusCode, String)> {
    repository::list_metrics(&state.pool)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

/// Build the Axum router exposing REST and WebSocket endpoints.
pub fn build_router(state: Arc<AppState>) -> Router {
    Router::new()
        // WebSocket endpoint
        .route(\"/ws/events\", get(ws_handler))
        // REST API endpoints (versioned)
        .route(\"/api/v1/repositories\", get(list_repositories_handler))
        .route(\"/api/v1/sessions\", get(list_sessions_handler))
        .route(\"/api/v1/tasks\", get(list_tasks_handler))
        .route(\"/api/v1/agents\", get(list_agents_handler))
        .route(\"/api/v1/metrics\", get(list_metrics_handler))
        .layer(Extension(state))
}
