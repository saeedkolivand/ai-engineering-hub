use anyhow::Result;
use notify::{RecommendedWatcher, RecursiveMode, Watcher, Event};
use std::path::PathBuf;
use tokio::sync::broadcast::Sender;
use serde_json::Value;
use tracing::info;

/// Starts a file watcher on the `metrics` directory and forwards parsed JSON logs
/// to the provided broadcast channel.
pub async fn start_watcher(state: std::sync::Arc<crate::db::AppState>, dir: PathBuf) -> Result<()> {
    let tx = state.tx.clone();

    // Create a new async watcher
    let mut watcher: RecommendedWatcher = Watcher::new_immediate(move |res: Result<Event, notify::Error>| {
        match res {
            Ok(event) => {
                // For simplicity, just emit a dummy metric on any change.
                // In a real implementation you would read the file contents here.
                let dummy = serde_json::json!({
                    "type": "file_change",
                    "path": event.paths.get(0).map(|p| p.to_string_lossy()).unwrap_or_default()
                });
                let _ = tx.send(dummy);
            }
            Err(e) => {
                tracing::error!("watch error: {:?}", e);
            }
        }
    })?;

    watcher.watch(&dir, RecursiveMode::Recursive)?;

    // Keep the watcher alive for the lifetime of the app.
    // Since this function runs in a spawned task, we just await forever.
    futures::future::pending::<()>().await;
    Ok(())
}