use tauri::api::config::Config;
use tauri::Manager;
use sqlx::SqlitePool;
use anyhow::Result;
use serde_json::Value;
use crate::repository::{get_token_usage_by_day, TokenUsage};
use crate::main::{create_app, AppState};
use rstest::rstest;

#[tokio::test]
async fn test_api_endpoints() -> Result<()> {
    // Set up an in-memory SQLite database for testing
    let pool = SqlitePool::connect("sqlite::memory:").await?;

    // Create necessary tables using sqlx migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    // Insert test data
    sqlx::query(
        r#"
        INSERT INTO raw_events (timestamp, source, event_type, payload, repository_id, agent_id)
        VALUES ('2023-01-01 12:00:00', 'test_source', 'token_usage', '{"tokens": 100}', 'repo1', 'agent1');
        INSERT INTO repositories (id, name) VALUES ('repo1', 'Test Repo');
        INSERT INTO agents (id, name, provider) VALUES ('agent1', 'Test Agent', 'Test Provider');
        "#,
    )
    .execute(&pool)
    .await?;

    // Create the Tauri app with the test database
    let (tx, _rx) = tokio::sync::broadcast::channel(100);
    let app = create_app(pool.clone(), tx);

    // Test the API endpoint
    let response = app
        .handle()
        .invoke_handler(tauri::InvokeRequest {
            command: "get_token_usage_by_day".into(),
            payload: Value::Null,
        })
        .await?;

    let result: Vec<TokenUsage> = serde_json::from_value(response)?;

    // Assert the result
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].day, "2023-01-01");
    assert_eq!(result[0].repository, "Test Repo");
    assert_eq!(result[0].provider, "Test Provider");
    assert_eq!(result[0].agent, "Test Agent");
    assert_eq!(result[0].total_tokens, 100);

    Ok(())
}

// Helper function to create the Tauri app with the test database
fn create_app(pool: SqlitePool, tx: tokio::sync::broadcast::Sender<Value>) -> tauri::App {
    tauri::Builder::default()
        .setup(move |app| {
            app.manage(AppState { pool, tx });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_token_usage_by_day,
            // Add other API handlers here
        ])
        .build(tauri::generate_context!())
        .expect("Failed to create Tauri app")
}