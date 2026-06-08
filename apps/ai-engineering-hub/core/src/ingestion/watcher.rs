//! File-watching ingestion path. Watches user-configured directories and ingests
//! new/changed `.json`/`.jsonl` files line-by-line via the passthrough adapter.
use crate::error::AppResult;
use crate::ingestion::adapter::{PassthroughAdapter, SourceAdapter};
use crate::ingestion::ingest;
use crate::state::SharedState;
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};

fn is_jsonish(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|e| e.to_str()),
        Some("json") | Some("jsonl") | Some("ndjson")
    )
}

/// Infer a source key from a file path (parent dir name), falling back to "file".
/// Unknown keys auto-register via the registry.
fn source_key_for(path: &Path) -> String {
    path.parent()
        .and_then(|p| p.file_name())
        .and_then(|n| n.to_str())
        .unwrap_or("file")
        .to_string()
}

async fn process_file(state: &SharedState, path: &Path) -> AppResult<()> {
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| crate::error::AppError::Internal(e.into()))?;
    let source_key = source_key_for(path);
    let adapter = PassthroughAdapter;

    for line in content.lines().filter(|l| !l.trim().is_empty()) {
        if let Ok(raw) = serde_json::from_str::<serde_json::Value>(line) {
            for ev in adapter.parse(&source_key, &raw) {
                ingest(state, ev).await?;
            }
        }
    }
    Ok(())
}

/// Start watching `dirs`. The returned watcher must be kept alive by the caller.
pub fn start_watcher(state: SharedState, dirs: Vec<PathBuf>) -> AppResult<RecommendedWatcher> {
    let handle = tokio::runtime::Handle::current();
    let mut watcher = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
        let Ok(event) = res else { return };
        if !matches!(event.kind, EventKind::Create(_) | EventKind::Modify(_)) {
            return;
        }
        for path in event.paths {
            if is_jsonish(&path) {
                let state = state.clone();
                handle.spawn(async move {
                    if let Err(e) = process_file(&state, &path).await {
                        tracing::warn!("watcher: failed to ingest {:?}: {e}", path.file_name());
                    }
                });
            }
        }
    })
    .map_err(|e| crate::error::AppError::Internal(e.into()))?;

    for dir in dirs {
        watcher
            .watch(&dir, RecursiveMode::Recursive)
            .map_err(|e| crate::error::AppError::Internal(e.into()))?;
    }
    Ok(watcher)
}
