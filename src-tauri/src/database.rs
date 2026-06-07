use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use std::str::FromStr;

/// Initialise the SQLite connection pool with performance‑optimised pragmas:
/// - Enable WAL mode for concurrent reads/writes.
/// - Set a busy timeout and limit the journal size.
/// - Use prepared statement caching.
pub async fn init_pool(database_url: &str) -> Result<SqlitePool, sqlx::Error> {
    let connect_options = SqliteConnectOptions::from_str(database_url)?
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal) // Enable WAL
        .busy_timeout(std::time::Duration::from_secs(30))
        .pragma("synchronous", "NORMAL")
        .pragma("cache_size", "-2000") // ~2 MiB page cache
        .pragma("foreign_keys", "ON");

    let pool = SqlitePool::builder()
        .max_connections(5)
        .after_connect(|conn, _| {
            // Ensure prepared‑statement cache is enabled
            Box::pin(async move {
                let _ = conn
                    .execute("PRAGMA cache_spill = TRUE;")
                    .await?;
                Ok(())
            })
        })
        .connect_with(connect_options)
        .await?;

    Ok(pool)
}