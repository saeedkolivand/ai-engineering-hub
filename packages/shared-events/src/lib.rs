use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEvent {
    pub id: Uuid,
    pub repository: String,
    pub task: String,
    pub agent: String,
    pub event_type: String, // "intervention", "metric", etc.
    pub timestamp: DateTime<Utc>,
    pub token_impact: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum HubEvent {
    #[serde(rename = "tokenUsage")]
    TokenUsage(serde_json::Value),
    #[serde(rename = "savings")]
    Savings(serde_json::Value),
    #[serde(rename = "buildStatus")]
    BuildStatus(serde_json::Value),
    #[serde(rename = "activity")]
    Activity(ActivityEvent),
}