use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicU32, Ordering};
use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use serde_json::Value;
use tower::ServiceExt;
use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};
use uuid::Uuid;

use ai_engineering_backend::db;
use ai_engineering_backend::routes;

static TEST_COUNTER: AtomicU32 = AtomicU32::new(0);

/// Helper to build a test app with a unique temporary file-based DB
async fn build_test_app() -> (Router, SqlitePool) {
    let id = TEST_COUNTER.fetch_add(1, Ordering::SeqCst);
    // Use a unique file path in the system temp directory
    let db_path = format!("test_db_{}.sqlite", id);
    let db_url = format!("sqlite:{}?mode=rwc", db_path);

    let pool = SqlitePool::connect(&db_url)
        .await
        .expect("Failed to create SQLite pool");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Migrations should run without error");

    // Generate unique IDs for test data
    let repo_id = Uuid::new_v4().to_string();
    let session_id = Uuid::new_v4().to_string();
    let agent_id = Uuid::new_v4().to_string();
    let task_id = Uuid::new_v4().to_string();
    let metric_id = Uuid::new_v4().to_string();

    // Insert test data with unique IDs
    sqlx::query("INSERT INTO repositories (id, name, path) VALUES (?, 'test-repo', '/tmp/repo')")
        .bind(&repo_id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("INSERT INTO sessions (id, repository_id, status) VALUES (?, ?, 'running')")
        .bind(&session_id)
        .bind(&repo_id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("INSERT INTO agents (id, name, provider) VALUES (?, 'Claude', 'anthropic')")
        .bind(&agent_id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query(
        "INSERT INTO tasks (id, session_id, name, status, tokens_used, tokens_saved) VALUES (?, ?, 'test-task', 'completed', 1000, 200)"
    )
    .bind(&task_id)
    .bind(&session_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO metrics (id, task_id, metric_type, value, unit, recorded_at) VALUES (?, ?, 'tokens', 500.0, 'count', '2026-06-07T10:00:00Z')"
    )
    .bind(&metric_id)
    .bind(&task_id)
    .execute(&pool)
    .await
    .unwrap();

    let (tx, _) = tokio::sync::broadcast::channel(100);
    let app_state = Arc::new(db::AppState {
        pool: pool.clone(),
        tx,
    });

    let app = Router::new()
        .route("/api/health", axum::routing::get(|| async { axum::Json(serde_json::json!({"status": "ok"})) }))
        .merge(routes::api::api_router())
        .merge(routes::router())
        .with_state(app_state);

    (app, pool)
}

#[tokio::test]
async fn test_database_initialization() {
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .expect("Failed to create in-memory SQLite pool");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Migrations should run without error");

    let row: (i64,) = sqlx::query_as("SELECT 1")
        .fetch_one(&pool)
        .await
        .expect("Simple query failed");

    assert_eq!(row.0, 1);
}

#[tokio::test]
async fn test_health_endpoint() {
    let (app, _pool) = build_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["status"], "ok");
}

#[tokio::test]
async fn test_list_repositories() {
    let (app, _pool) = build_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/repositories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&body).unwrap();
    let repos = json["repositories"].as_array().unwrap();
    assert_eq!(repos.len(), 1);
    assert_eq!(repos[0]["name"], "test-repo");
}

#[tokio::test]
async fn test_list_sessions() {
    let (app, _pool) = build_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/sessions")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&body).unwrap();
    let sessions = json["sessions"].as_array().unwrap();
    assert_eq!(sessions.len(), 1);
}

#[tokio::test]
async fn test_list_tasks() {
    let (app, _pool) = build_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/tasks")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&body).unwrap();
    let tasks = json["tasks"].as_array().unwrap();
    assert_eq!(tasks.len(), 1);
    assert_eq!(tasks[0]["name"], "test-task");
    assert_eq!(tasks[0]["tokens_used"], 1000);
}

#[tokio::test]
async fn test_list_agents() {
    let (app, _pool) = build_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/agents")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&body).unwrap();
    let agents = json["agents"].as_array().unwrap();
    assert_eq!(agents.len(), 1);
    assert_eq!(agents[0]["name"], "Claude");
}

#[tokio::test]
async fn test_list_metrics() {
    let (app, _pool) = build_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/metrics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&body).unwrap();
    let metrics = json["metrics"].as_array().unwrap();
    assert_eq!(metrics.len(), 1);
    assert_eq!(metrics[0]["metric_type"], "tokens");
}

#[tokio::test]
async fn test_analytics() {
    let (app, _pool) = build_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/analytics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert!(json["token_metrics"].is_object());
    assert!(json["savings"].is_object());
    assert_eq!(json["savings"]["total"], 200);
}