use axum::Router;
use axum::{extract::State, routing::get, Json};
use serde_json::json;
use std::sync::Arc;

use crate::db::AppState;
use crate::repository::*;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/health", get(health_handler))
        .route("/api/repositories", get(list_repositories_handler))
        .route("/api/sessions", get(list_sessions_handler))
        .route("/api/tasks", get(list_tasks_handler))
        .route("/api/agents", get(list_agents_handler))
        .route("/api/analytics", get(get_analytics_handler))
        .with_state(state)
}

async fn health_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    Json(json!({ "status": "ok", "db_connected": !state.pool.is_closed() }))
}

async fn list_repositories_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    match list_repositories(&state.pool).await {
        Ok(repos) => Json(json!({ "repositories": repos })),
        Err(e) => Json(json!({ "error": format!("{}", e) })),
    }
}

async fn list_sessions_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    match list_sessions(&state.pool).await {
        Ok(sessions) => Json(json!({ "sessions": sessions })),
        Err(e) => Json(json!({ "error": format!("{}", e) })),
    }
}

async fn list_tasks_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    match list_tasks(&state.pool).await {
        Ok(tasks) => Json(json!({ "tasks": tasks })),
        Err(e) => Json(json!({ "error": format!("{}", e) })),
    }
}

async fn list_agents_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    match list_agents(&state.pool).await {
        Ok(agents) => Json(json!({ "agents": agents })),
        Err(e) => Json(json!({ "error": format!("{}", e) })),
    }
}

async fn get_analytics_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    let daily = get_token_usage_by_day(&state.pool).await.unwrap_or(0);
    let weekly = get_token_usage_by_week(&state.pool).await.unwrap_or(0);
    let monthly = get_token_usage_by_month(&state.pool).await.unwrap_or(0);
    let savings = get_total_savings(&state.pool).await.unwrap_or(0);

    Json(json!({
        "token_metrics": {
            "daily": daily,
            "weekly": weekly,
            "monthly": monthly,
        },
        "savings": {
            "total": savings,
        }
    }))
}
