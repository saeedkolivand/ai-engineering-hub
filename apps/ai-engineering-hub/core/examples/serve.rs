//! Headless Hub API server — for browser-based frontend dev (`pnpm dev` runs the UI only).
//! Run alongside the Vite dev server:
//!   cargo run -p aeh-core --example serve
//! Serves REST + WebSocket on http://127.0.0.1:47800 (same as the Tauri app does in prod).
use aeh_core::{run, DEFAULT_PORT};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    // Dev database in the current working directory.
    run("hub-dev.sqlite", DEFAULT_PORT).await
}
