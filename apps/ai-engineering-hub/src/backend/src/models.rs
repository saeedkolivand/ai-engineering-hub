// Note: These models are kept for documentation/type clarity.
// The repository layer uses its own structs for DB queries.
#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Repository {
    pub id: String,
    pub name: String,
    pub path: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: String,
    pub repository_id: String,
    pub status: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub model_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Task {
    pub id: String,
    pub session_id: String,
    pub name: String,
    pub agent_id: Option<String>,
    pub status: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub tokens_used: Option<i64>,
    pub tokens_saved: Option<i64>,
    pub interventions: Option<i64>,
    pub retries: Option<i64>,
    pub first_pass_success: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Metric {
    pub id: String,
    pub task_id: Option<String>,
    pub metric_type: String,
    pub value: f64,
    pub unit: String,
    pub recorded_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ActivityEvent {
    pub id: String,
    pub repository_id: Option<String>,
    pub session_id: Option<String>,
    pub task_id: Option<String>,
    pub agent_id: Option<String>,
    pub event_type: String,
    pub description: Option<String>,
    pub token_impact: Option<i64>,
    pub metadata: Option<String>,
    pub timestamp: String,
    pub created_at: String,
}