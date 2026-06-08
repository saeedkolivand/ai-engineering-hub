use anyhow::Result;
use sqlx::SqlitePool;
use serde_json::Value;
use tokio::sync::broadcast::Receiver;
use tracing::info;

pub async fn start_collector(pool: SqlitePool, mut rx: Receiver<Value>) -> Result<()> {
    while let Ok(event) = rx.recv().await {
        let event_type = event.get("type").and_then(Value::as_str);
        let payload = event.get("payload").cloned().unwrap_or_default();

        if let Some(event_type) = event_type {
            let query = r#"
                INSERT INTO raw_events (timestamp, source, event_type, payload, repository_id, session_id, task_id, agent_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#;

            let repository_id = payload.get("repository_id").and_then(Value::as_str);
            let session_id = payload.get("session_id").and_then(Value::as_str);
            let task_id = payload.get("task_id").and_then(Value::as_str);
            let agent_id = payload.get("agent_id").and_then(Value::as_str);

            sqlx::query(query)
                .bind(chrono::Utc::now())
                .bind("metric_collector")
                .bind(event_type)
                .bind(payload.to_string())
                .bind(repository_id)
                .bind(session_id)
                .bind(task_id)
                .bind(agent_id)
                .execute(&pool)
                .await?;

            info!("Collected event: {}", event_type);
        }
    }

    Ok(())
}