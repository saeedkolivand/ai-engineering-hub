use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use shared_types::{Repository, Session, Task, Agent, Intervention, RawEvent};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventEnvelope<T = serde_json::Value> {
    pub id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub version: String,
    pub r#type: String,
    pub payload: T,
    pub metadata: EventMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EventMetadata {
    pub repository_id: Option<Uuid>,
    pub session_id: Option<Uuid>,
    pub task_id: Option<Uuid>,
    pub agent_id: Option<Uuid>,
    pub source: Option<String>,
}

// Example type definitions for common events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsagePayload {
    pub provider: String,
    pub model: String,
    pub prompt_tokens: u64,
    pub completion_tokens: u64,
    pub total_tokens: u64,
    pub cost: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentActionPayload {
    pub action: String,
    pub tool_name: String,
    pub input: serde_json::Value,
    pub output: serde_json::Value,
    pub duration_ms: u64,
}