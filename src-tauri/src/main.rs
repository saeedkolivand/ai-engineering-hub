#[cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod database;
mod router;
mod repository;

use tauri::Manager;

#[tokio::main]
async fn main() {
    // Initialise SQLite with WAL and performance pragmas
    let db_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:metrics.db".into());
    let db_pool = database::init_pool(&db_url)
        .await
        .expect("Failed to initialise SQLite pool");

    // Store the pool in Tauri state for injection into handlers
    tauri::Builder::default()
        .manage(db_pool)
        .invoke_handler(tauri::generate_handler![
            // list your invoke commands here
        ])
        .setup(|app| {
            // start the Axum server in a background task
            let pool = app.state::<sqlx::SqlitePool>().clone();
            tauri::async_runtime::spawn(async move {
                let router = router::create_router(pool);
                axum::Server::bind(&"127.0.0.1:0".parse().unwrap())
                    .serve(router.into_make_service())
                    .await
                    .expect("Axum server failed");
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}