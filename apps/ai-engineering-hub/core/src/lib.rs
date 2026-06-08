//! AI Engineering Hub core (Tauri-free): SQLite + dynamic ingestion + dimensional
//! analytics + repository intelligence, exposed over an Axum HTTP/WebSocket server.
//!
//! The Tauri shell (`src-tauri`) depends on this crate and spawns [`server::serve`]
//! inside its own process, so everything runs in the single Tauri application.
pub mod analytics;
pub mod db;
pub mod error;
pub mod ingestion;
pub mod intelligence;
pub mod models;
pub mod server;
pub mod sources;
pub mod state;

pub use error::{AppError, AppResult};
pub use state::{AppState, SharedState, DEFAULT_PORT};

use anyhow::Result;

/// Initialize the database (creating + migrating + seeding presets) and build shared state.
pub async fn bootstrap(db_path: &str) -> Result<SharedState> {
    let pool = db::init_pool(db_path).await?;
    sources::seed_presets(&pool).await?;
    Ok(AppState::new(pool))
}

/// Convenience entry used by the Tauri shell: bootstrap + start collectors + serve.
/// Collectors are pull-based and gated on each source being enabled in the registry,
/// so enabling an integration in the UI actually starts producing data.
pub async fn run(db_path: &str, port: u16) -> Result<()> {
    let state = bootstrap(db_path).await?;
    ingestion::collectors::spawn(state.clone());
    server::serve(state, port).await
}
