use sqlx::SqlitePool;
use anyhow::Result;
use serde_json::Value;
use crate::repository::{get_token_usage_by_day, TokenUsage};
use rstest::rstest;

#[tokio::test]
async fn test_get_token_usage_by_day() -> Result<()> {
    // Set up an in-memory SQLite database for testing
    let pool = SqlitePool::connect("sqlite::memory:").await?;

    // Create necessary tables
    sqlx::query(
        r#"
        CREATE TABLE raw_events (
            id INTEGER PRIMARY KEY,
            timestamp DATETIME NOT NULL,
            source TEXT NOT NULL,
            event_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            repository_id TEXT,
            session_id TEXT,
            task_id TEXT,
            agent_id TEXT
        );
        CREATE TABLE repositories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            provider TEXT NOT NULL,
            model_id TEXT
        );
        "#,
    )
    .execute(&pool)
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

    // Call the function
    let result = get_token_usage_by_day(&pool).await?;

    // Assert the result
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].day, "2023-01-01");
    assert_eq!(result[0].repository, "Test Repo");
    assert_eq!(result[0].provider, "Test Provider");
    assert_eq!(result[0].agent, "Test Agent");
    assert_eq!(result[0].total_tokens, 100);

    Ok(())
}