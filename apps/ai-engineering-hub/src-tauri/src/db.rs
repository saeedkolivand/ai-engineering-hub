use anyhow::Result;
use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use tokio::sync::broadcast;
use serde_json::Value;

pub struct AppState {
    pub pool: SqlitePool,
    pub tx: broadcast::Sender<Value>,
}

// Production DB initialization (reads from ./db.sqlite)
pub async fn init_db() -> Result<SqlitePool> {
    let options = SqliteConnectOptions::new()
        .filename("./db.sqlite")
        .create_if_missing(true);
    let pool = SqlitePool::connect_with(options).await?;
    Ok(pool)
}

// In‑memory DB for tests (uses shared cache so pool connections see same data)
pub async fn init_db_in_memory() -> Result<SqlitePool> {
    let options = SqliteConnectOptions::new()
        .filename("file::memory:?cache=shared")
        .create_if_missing(true);
    let pool = SqlitePool::connect_with(options).await?;
    Ok(pool)
}