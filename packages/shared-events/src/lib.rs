//! Shared event contracts. Mirrors `packages/shared-events/src/index.ts` (TS↔Rust parity).
//!
//! `EventEnvelope` is the canonical ingest/transport shape: every event self-declares its
//! `source` (the dynamic tool key) plus optional hierarchy refs, and carries a typed payload.
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Optional drill-down hierarchy references attached to an event.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct EntityRefs {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub repository_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub agent_id: Option<String>,
}

/// The canonical envelope accepted by ingestion (HTTP push / file watcher / manual import)
/// and broadcast over the WebSocket. Source-agnostic by construction.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventEnvelope {
    /// Dynamic source/tool key, e.g. "claude-code", "rtk", or any user-defined slug.
    pub source: String,
    /// Event type, e.g. "token_usage", "savings", "build_status", "retrieval", "intervention".
    pub event_type: String,
    #[serde(default = "Utc::now")]
    pub timestamp: DateTime<Utc>,
    #[serde(default)]
    pub refs: EntityRefs,
    /// Tool-specific data (canonical fields after mapping).
    pub payload: serde_json::Value,
}

/// A human-facing activity feed entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEvent {
    pub id: Uuid,
    pub source: String,
    pub repository: String,
    pub task: String,
    pub agent: String,
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
    pub token_impact: i64,
}

/// Messages broadcast to WebSocket subscribers (hub UI + Stream Deck plugin).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum HubEvent {
    #[serde(rename = "event")]
    Event(EventEnvelope),
    #[serde(rename = "activity")]
    Activity(ActivityEvent),
}
