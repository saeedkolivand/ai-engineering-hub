use sqlx::{SqlitePool, Sqlite, migrate::MigrateDatabase};
use std::path::Path;
use tokio::sync::broadcast;
use serde_json::Value;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub tx: broadcast::Sender<Value>,
}

pub async fn init_db() -> anyhow::Result<SqlitePool> {
    let db_path = "ai_engineering.db";
    if !Path::new(db_path).exists() {
        Sqlite::create_database(&format!("sqlite://{db_path}?mode=rwc")).await?;
    }
    let pool = SqlitePool::connect(&format!("sqlite://{db_path}?mode=rwc")).await?;
    Ok(pool)
}
