use sqlx::{SqlitePool, Sqlite, migrate::MigrateDatabase};
use std::path::Path;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
}

pub async fn init_db() -> anyhow::Result<SqlitePool> {
    let db_path = "ai_engineering.db";
    if !Path::new(db_path).exists() {
        Sqlite::create_database(&format!("sqlite://{db_path}?mode=rwc")).await?;
    }
    let pool = SqlitePool::connect(&format!("sqlite://{db_path}?mode=rwc")).await?;
    Ok(pool)
}
