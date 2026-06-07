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

    // Build the app
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/api/health", get(health_handler))
        .route("/api/ingest/log", post(ingest_log_handler))
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
    Json(json!({ "message": "AI Engineering Hub Backend"}))
}

async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}

// Simple ingestion endpoint that wraps incoming payload into an EventEnvelope
async fn ingest_log_handler(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    // In a real implementation you would parse and store the event.
    // Here we just wrap it and return an ID.
    let envelope = EventEnvelope {
        id: Uuid::new_v4(),
        timestamp: Utc::now(),
        version: "1.0.0".to_string(),
        r#type: "raw_log".to_string(),
        payload,
        metadata: Default::default(),
    };
    // Placeholder: store event in DB (omitted)
    let resp = json!({
        "event_id": envelope.id,
        "status": "queued"
    });
    (StatusCode::ACCEPTED, Json(resp))
}