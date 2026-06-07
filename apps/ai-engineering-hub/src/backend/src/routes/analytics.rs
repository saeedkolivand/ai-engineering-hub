use axum::routing::get;
use axum::Router;
use crate::service::analytics;
use crate::db::AppState;
use axum::extract::Extension;
use anyhow::Result;
use serde_json::Value;

pub fn analytics_router() -> Router {
    Router::new()
        .route("/api/v1/analytics/token_daily", get(token_daily_handler))
        .layer(Extension(AppState::default()))
}

async fn token_daily_handler(
    Extension(state): Extension<AppState>,
) -> Result<Value, (axum::http::StatusCode, String)> {
    analytics::token_usage_daily(&state.pool)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}