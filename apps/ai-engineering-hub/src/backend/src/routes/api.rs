use std::sync::Arc;
use axum::{
    extract::State,
    routing::get,
    Json,
};
use serde_json::json;
use crate::db::AppState;
use crate::repository::*;

pub fn api_router() -> axum::Router<Arc<AppState>> {
    axum::Router::new()
        .route("/repositories", get(list_repositories_handler))
        .route("/sessions", get(list_sessions_handler))
        .route("/tasks", get(list_tasks_handler))
        .route("/agents", get(list_agents_handler))
        .route("/analytics", get(analytics_handler))
}

// Handlers
async fn list_repositories_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    match list_repositories(&state.pool).await {
        Ok(repos) => Json(json!({ "repositories": repos })),
        Err(e) => Json(json!({ "error": e.to_string() })),
    }
}

async fn list_sessions_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    match list_sessions(&state.pool).await {
        Ok(sessions) => Json(json!({ "sessions": sessions })),
        Err(e) => Json(json!({ "error": e.to_string() })),
    }
}

async fn list_tasks_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    match list_tasks(&state.pool).await {
        Ok(tasks) => Json(json!({ "tasks": tasks })),
        Err(e) => Json(json!({ "error": e.to_string() })),
    }
}

async fn list_agents_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    match list_agents(&state.pool).await {
        Ok(agents) => Json(json!({ "agents": agents })),
        Err(e) => Json(json!({ "error": e.to_string() })),
    }
}

async fn analytics_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    let token_metrics = json!({
        "daily": get_token_usage_by_day(&state.pool).await.unwrap_or(0),
        "weekly": get_token_usage_by_week(&state.pool).await.unwrap_or(0),
        "monthly": get_token_usage_by_month(&state.pool).await.unwrap_or(0),
    });
    let savings = json!({
        "total": get_total_savings(&state.pool).await.unwrap_or(0),
    });
    Json(json!({ "token_metrics": token_metrics, "savings": savings }))
}