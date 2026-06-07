use sqlx::SqlitePool;
use anyhow::Result;
use serde_json::Value;

// Placeholder implementations – you should replace these with the actual queries
// from the original backend `repository.rs`. For brevity, dummy data is returned.

pub async fn list_repositories(_pool: &SqlitePool) -> Result<Value> {
    // TODO: replace with real DB query
    Ok(serde_json::json!([]))
}

pub async fn list_sessions(_pool: &SqlitePool) -> Result<Value> {
    Ok(serde_json::json!([]))
}

pub async fn list_tasks(_pool: &SqlitePool) -> Result<Value> {
    Ok(serde_json::json!([]))
}

pub async fn list_agents(_pool: &SqlitePool) -> Result<Value> {
    Ok(serde_json::json!([]))
}

pub async fn list_metrics(_pool: &SqlitePool) -> Result<Value> {
    Ok(serde_json::json!([]))
}

pub async fn get_token_usage_by_day(_pool: &SqlitePool) -> Result<i64> {
    Ok(0)
}
pub async fn get_token_usage_by_week(_pool: &SqlitePool) -> Result<i64> {
    Ok(0)
}
pub async fn get_token_usage_by_month(_pool: &SqlitePool) -> Result<i64> {
    Ok(0)
}
pub async fn get_total_savings(_pool: &SqlitePool) -> Result<i64> {
    Ok(0)
}