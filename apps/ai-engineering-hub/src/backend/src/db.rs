use sqlx::{SqlitePool, Sqlite, migrate::MigrateDatabase};
use std::path::Path;

/// Initialize the SQLite database and run migrations.
pub async fn init_db() -> anyhow::Result<SqlitePool> {
    // Ensure the database file exists
    let db_path = "ai_engineering.db";
    if !Path::new(db_path).exists() {
        Sqlite::create_database(&format!("sqlite://{db_path}?mode=rwc")).await?;
    }

    // Establish a connection pool
    let pool = SqlitePool::connect(&format!("sqlite://{db_path}?mode=rwc")).await?;

    // Run migrations (if a migrations folder exists)
    // sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}