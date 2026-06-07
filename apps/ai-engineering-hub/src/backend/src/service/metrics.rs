use sqlx::SqlitePool;
use crate::repository;

/// Retrieve the most recent metrics from the database
pub async fn get_recent_metrics(pool: &SqlitePool) -> Vec<repository::Metric> {
    repository::list_metrics(pool).await.unwrap_or_default()
}
