//! Dynamic, source-agnostic ingestion.
//!
//! Three paths feed the same `ingest` core: HTTP push (`POST /api/v1/ingest`),
//! the file watcher, and manual import. Sources are resolved/auto-registered via
//! the registry; nothing here is hardcoded per-tool.
pub mod adapter;
pub mod collectors;
pub mod watcher;

use crate::error::AppResult;
use crate::sources;
use crate::state::SharedState;
use shared_events::{EventEnvelope, HubEvent};
use uuid::Uuid;

/// Persist one canonical event and broadcast it to live subscribers.
/// Auto-registers the source on first sight.
pub async fn ingest(state: &SharedState, event: EventEnvelope) -> AppResult<()> {
    let source_id = sources::ensure_source(&state.pool, &event.source).await?;
    let id = Uuid::new_v4().to_string();
    let ts = event.timestamp.to_rfc3339();
    let payload = event.payload.to_string();

    sqlx::query(
        "INSERT INTO raw_events \
         (id, timestamp, source, source_id, event_type, payload, repository_id, session_id, task_id, agent_id) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&ts)
    .bind(&event.source)
    .bind(&source_id)
    .bind(&event.event_type)
    .bind(&payload)
    .bind(&event.refs.repository_id)
    .bind(&event.refs.session_id)
    .bind(&event.refs.task_id)
    .bind(&event.refs.agent_id)
    .execute(&state.pool)
    .await?;

    // Best-effort broadcast (no subscribers is not an error).
    let _ = state.tx.send(HubEvent::Event(event));
    Ok(())
}

/// Ingest a batch (e.g. a parsed log file or manual import).
pub async fn ingest_batch(state: &SharedState, events: Vec<EventEnvelope>) -> AppResult<usize> {
    let mut n = 0;
    for ev in events {
        ingest(state, ev).await?;
        n += 1;
    }
    Ok(n)
}
