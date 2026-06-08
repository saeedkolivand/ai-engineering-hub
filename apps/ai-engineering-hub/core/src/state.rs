//! Shared application state injected into the Axum layer and the Tauri shell.
use shared_events::HubEvent;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::broadcast;

/// Default fixed localhost port for the Hub API/WS (configurable via settings later).
pub const DEFAULT_PORT: u16 = 47800;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    /// Real-time fan-out to WebSocket subscribers (hub UI + Stream Deck plugin).
    pub tx: broadcast::Sender<HubEvent>,
}

pub type SharedState = Arc<AppState>;

impl AppState {
    pub fn new(pool: SqlitePool) -> SharedState {
        let (tx, _rx) = broadcast::channel(1024);
        Arc::new(AppState { pool, tx })
    }
}
