use axum::{
    routing::get,
    Router,
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use serde_json::json;
use uuid::Uuid;

/// Build the API router (stateless, compatible with any state type)
pub fn router<S: Clone + Send + Sync + 'static>() -> Router<S> {
    Router::new()
        // Health
        .route("/api/health", get(health_handler))
        // Repository routes (placeholder)
        .route("/api/repositories", get(list_repositories))
        // Session routes (placeholder)
        .route("/api/sessions", get(list_sessions))
        // Task routes (placeholder)
        .route("/api/tasks", get(list_tasks))
        // Agent routes (placeholder)
        .route("/api/agents", get(list_agents))
}

/// Health check
async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({"status": "ok"})))
}

/// List all repositories (placeholder)
async fn list_repositories() -> impl IntoResponse {
    let repos: Vec<serde_json::Value> = vec![];
    (StatusCode::OK, Json(json!({"repositories": repos})))
}

/// List all sessions (placeholder)
async fn list_sessions() -> impl IntoResponse {
    let sessions: Vec<serde_json::Value> = vec![];
    (StatusCode::OK, Json(json!({"sessions": sessions})))
}

/// List all tasks (placeholder)
async fn list_tasks() -> impl IntoResponse {
    let tasks: Vec<serde_json::Value> = vec![];
    (StatusCode::OK, Json(json!({"tasks": tasks})))
}

/// List all agents (placeholder)
async fn list_agents() -> impl IntoResponse {
    let agents: Vec<serde_json::Value> = vec![
        json!({"id": Uuid::new_v4(), "name": "Claude"}),
        json!({"id": Uuid::new_v4(), "name": "OpenCode"}),
        json!({"id": Uuid::new_v4(), "name": "Cline"}),
        json!({"id": Uuid::new_v4(), "name": "Gemini CLI"}),
        json!({"id": Uuid::new_v4(), "name": "RTK"}),
        json!({"id": Uuid::new_v4(), "name": "Graphify"}),
        json!({"id": Uuid::new_v4(), "name": "CodeGraph"}),
    ];
    (StatusCode::OK, Json(json!({"agents": agents})))
}