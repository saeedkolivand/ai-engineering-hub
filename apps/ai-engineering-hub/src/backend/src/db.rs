use anyhow::Result;
use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use std::path::PathBuf;

pub struct AppState {
    pub pool: SqlitePool,
    // other shared resources can be added here
}

// Production DB initialization (reads from ./db.sqlite)
pub async fn init_db() -> Result<SqlitePool> {
    let options = SqliteConnectOptions::new()
        .filename("./db.sqlite")
        .create_if_missing(true);
    let pool = SqlitePool::connect_with(options).await?;
    Ok(pool)
}

// In‑memory DB for tests
pub async fn init_db_in_memory() -> Result<SqlitePool> {
    let options = SqliteConnectOptions::new()
        .filename(":memory:")
        .create_if_missing(true);
    let pool = SqlitePool::connect_with(options).await?;
    Ok(pool)
}