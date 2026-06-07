use super::db;
use sqlx::SqlitePool;

#[tokio::test]
async fn test_database_initialization() {
    // Initialize the database (in-memory for testing)
    let pool: SqlitePool = db::init_db_in_memory()
        .await
        .expect("Failed to create in‑memory SQLite pool");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Migrations should run without error");

    // Simple query to verify the DB is operational
    let row: (i64,) = sqlx::query_as("SELECT 1")
        .fetch_one(&pool)
        .await
        .expect("Simple query failed");

    assert_eq!(row.0, 1);
}