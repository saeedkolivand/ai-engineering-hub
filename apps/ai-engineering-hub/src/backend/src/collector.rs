use notify::{Watcher, RecursiveMode, Result as NotifyResult, Event, EventKind};
use std::sync::Arc;
use sqlx::SqlitePool;
use serde::Deserialize;
use std::path::PathBuf;
use tokio::sync::mpsc;
use futures::stream::StreamExt;
use tokio_stream::wrappers::ReceiverStream;

#[derive(Debug, Deserialize)]
pub struct MetricInput {
    pub id: String,
    pub task_id: Option<String>,
    pub metric_type: String,
    pub value: f64,
    pub unit: Option<String>,
    pub recorded_at: String,
}

pub async fn start_watcher(state: Arc<AppState>, metrics_dir: PathBuf) -> NotifyResult<()> {
    let pool = &state.pool;
    // Channel for receiving events from the notify watcher
    let (tx, mut rx) = mpsc::unbounded_channel::<Event>();

    // Initialize the watcher (using the recommended RecommendedWatcher)
    let mut watcher = notify::recommended_watcher(move |res| {
        // Forward events to the async channel
        if let Ok(event) = res {
            let _ = tx.send(event);
        }
    })?;

    // Watch the directory recursively for new files
    watcher.watch(&metrics_dir, RecursiveMode::NonRecursive)?;

    // Process events
    while let Some(event) = rx.recv().await {
        // Only handle create events for files
        if let EventKind::Create(_) = event.kind {
            for path in event.paths {
if let Some(ext) = path.extension() {
    if ext == "json" {
                        // Read and insert metric
                        if let Ok(content) = tokio::fs::read_to_string(&path).await {
                            if let Ok(metric) = serde_json::from_str::<MetricInput>(&content) {
let _ = sqlx::query(
r#"INSERT OR IGNORE INTO metrics (id, task_id, metric_type, value, unit, recorded_at)
   VALUES (?, ?, ?, ?, ?, ?)"#
)
.bind(&metric.id)
.bind(&metric.task_id)
.bind(&metric.metric_type)
.bind(metric.value)
.bind(&metric.unit)
.bind(&metric.recorded_at)
.execute(pool)
.await;
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}