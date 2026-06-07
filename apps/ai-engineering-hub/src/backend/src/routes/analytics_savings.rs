use axum::routing::get;
use axum::Router;
use crate::db::AppState;
use axum::extract::Extension;
use anyhow::Result;
use serde_json::Value;
use crate::service::analytics;

pub fn savings_router() -> Router {
    Router::new()
        .route("/api/v1/analytics/savings_daily", get(savings_daily_handler))
        .layer(Extension(AppState::default()))
}

async fn savings_daily_handler(
    Extension(state): Extension<AppState>,
) -> Result<Value, (axum::http::StatusCode, String)> {
    analytics::savings_daily(&state.pool)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}