use axum::{
    routing::{get, post},
    Router,
    Json,
    extract::Extension,
    response::IntoResponse,
    http::StatusCode,
};
use std::net::SocketAddr;
use sqlx::SqlitePool;
use tracing_subscriber::{fmt, EnvFilter};
use shared_events::{EventEnvelope, TokenUsagePayload};
use serde_json::json;
use uuid::Uuid;
use chrono::Utc;

// Import the router module we just created
mod routes;
use routes::router as api_router;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    // Create SQLite connection pool
    let db_url = "sqlite://ai_engineering.db?mode=rwc";
    let pool = SqlitePool::connect(&db_url).await?;
    // Run migrations (if any) - placeholder
    // sqlx::migrate!("./migrations").run(&pool).await?;

    // Build the app, mounting the API router under /api
    let app = Router::new()
        .route("/", get(root_handler))
        .nest("/api", api_router())
        .layer(Extension(pool));

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("Listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    Ok(())
}

async fn root_handler() -> impl IntoResponse {
    Json(json!({ "message": "AI Engineering Hub Backend" }))
}