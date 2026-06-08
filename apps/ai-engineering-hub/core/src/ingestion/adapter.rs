//! Source adapters. A `SourceAdapter` turns a raw record (JSON line / log line)
//! into canonical `EventEnvelope`s. The `ConfigurableAdapter` is driven entirely by
//! a source's `mapping_rules`, so new tools need zero recompile.
use serde_json::Value;
use shared_events::{EntityRefs, EventEnvelope};
use shared_types::MappingRule;

pub trait SourceAdapter {
    /// Parse a raw record into zero or more canonical events.
    fn parse(&self, source_key: &str, raw: &Value) -> Vec<EventEnvelope>;
}

/// Pass-through adapter: the raw record is already a canonical envelope-ish JSON
/// (`{ event_type, payload, ... }`). Used when a tool emits to the HTTP push API.
pub struct PassthroughAdapter;

impl SourceAdapter for PassthroughAdapter {
    fn parse(&self, source_key: &str, raw: &Value) -> Vec<EventEnvelope> {
        let event_type = raw
            .get("event_type")
            .and_then(Value::as_str)
            .unwrap_or("unknown")
            .to_string();
        let payload = raw.get("payload").cloned().unwrap_or_else(|| raw.clone());
        vec![EventEnvelope {
            source: source_key.to_string(),
            event_type,
            timestamp: chrono::Utc::now(),
            refs: EntityRefs::default(),
            payload,
        }]
    }
}

/// Config-driven adapter: extracts canonical fields from arbitrary records using
/// the source's mapping rules. No code change to onboard a new tool format.
pub struct ConfigurableAdapter {
    pub rules: Vec<MappingRule>,
}

impl ConfigurableAdapter {
    fn extract(&self, raw: &Value, target: &str) -> Option<Value> {
        let rule = self.rules.iter().find(|r| r.target == target)?;
        match rule.kind.as_str() {
            "const" => Some(Value::String(rule.expr.clone())),
            // Minimal JSON pointer support (e.g. "/usage/total_tokens").
            "jsonpath" | "pointer" => raw.pointer(&to_pointer(&rule.expr)).cloned(),
            _ => None,
        }
    }
}

fn to_pointer(expr: &str) -> String {
    // Accept "a.b.c", "/a/b/c", or "$.a.b" and normalize to a JSON pointer.
    let trimmed = expr.trim_start_matches("$.").trim_start_matches('$');
    if trimmed.starts_with('/') {
        trimmed.to_string()
    } else {
        format!("/{}", trimmed.replace('.', "/"))
    }
}

impl SourceAdapter for ConfigurableAdapter {
    fn parse(&self, source_key: &str, raw: &Value) -> Vec<EventEnvelope> {
        let event_type = self
            .extract(raw, "event_type")
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_else(|| "unknown".to_string());

        // Build the canonical payload from mapped targets (excluding control fields).
        let mut payload = serde_json::Map::new();
        for rule in &self.rules {
            if rule.target == "event_type" {
                continue;
            }
            if let Some(v) = self.extract(raw, &rule.target) {
                payload.insert(rule.target.clone(), v);
            }
        }

        let refs = EntityRefs {
            repository_id: self
                .extract(raw, "repository_id")
                .and_then(|v| v.as_str().map(String::from)),
            session_id: self
                .extract(raw, "session_id")
                .and_then(|v| v.as_str().map(String::from)),
            task_id: self
                .extract(raw, "task_id")
                .and_then(|v| v.as_str().map(String::from)),
            agent_id: self
                .extract(raw, "agent_id")
                .and_then(|v| v.as_str().map(String::from)),
        };

        vec![EventEnvelope {
            source: source_key.to_string(),
            event_type,
            timestamp: chrono::Utc::now(),
            refs,
            payload: Value::Object(payload),
        }]
    }
}
