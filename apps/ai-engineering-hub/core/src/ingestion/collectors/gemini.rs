//! Gemini CLI collector (best-effort). Gemini CLI only writes a local, parseable token
//! log when the user opts into file telemetry (`telemetry.target=local` +
//! `telemetry.outfile` in `~/.gemini/settings.json`). When that file exists we tail it and
//! emit `token_usage` events; otherwise this yields nothing. The `gemini_cli.token.usage`
//! metric records a model + a token count, which is what we extract.
use super::{home_dir, CollectedEvent};
use crate::error::AppResult;
use chrono::Utc;
use serde_json::{json, Value};
use shared_events::{EntityRefs, EventEnvelope};
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

pub struct Gemini {
    log_path: Option<PathBuf>,
    offset: AtomicU64,
}

impl Gemini {
    pub fn new() -> Self {
        Self {
            log_path: home_dir().map(|h| h.join(".gemini").join("telemetry.log")),
            offset: AtomicU64::new(0),
        }
    }

    pub async fn collect(&self) -> AppResult<Vec<CollectedEvent>> {
        let Some(path) = self.log_path.as_ref() else { return Ok(vec![]) };
        if !path.exists() {
            return Ok(vec![]);
        }
        let len = tokio::fs::metadata(path).await.map(|m| m.len()).unwrap_or(0);
        let start = self.offset.load(Ordering::Relaxed);
        if len <= start {
            return Ok(vec![]);
        }
        let content = tokio::fs::read_to_string(path).await.unwrap_or_default();
        self.offset.store(len, Ordering::Relaxed);

        let mut out = Vec::new();
        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            if let Ok(v) = serde_json::from_str::<Value>(line) {
                if let Some(ev) = parse_record(&v) {
                    out.push(ev);
                }
            }
        }
        Ok(out)
    }
}

/// Extract a token count from a Gemini telemetry record, tolerating the common
/// attribute spellings. Returns `None` for anything that isn't a token record.
fn parse_record(v: &Value) -> Option<CollectedEvent> {
    let total = find_u64(v, "total_token_count")
        .or_else(|| find_u64(v, "token_count"))
        .or_else(|| {
            let i = find_u64(v, "input_token_count").unwrap_or(0);
            let o = find_u64(v, "output_token_count").unwrap_or(0);
            (i + o > 0).then_some(i + o)
        })?;
    if total == 0 {
        return None;
    }
    let model = find_str(v, "model").unwrap_or_else(|| "unknown".into());
    let payload = json!({ "tokens": total, "model": model, "provider": "google" });
    let dedup = format!("gemini:{:016x}", fnv1a_value(v));
    Some(CollectedEvent {
        dedup_id: dedup,
        event: EventEnvelope {
            source: "gemini-cli".into(),
            event_type: "token_usage".into(),
            timestamp: Utc::now(),
            refs: EntityRefs::default(),
            payload,
        },
        upserts: Vec::new(),
    })
}

/// Recursively find the first integer value for `key` anywhere in the record.
fn find_u64(v: &Value, key: &str) -> Option<u64> {
    match v {
        Value::Object(map) => {
            if let Some(n) = map.get(key).and_then(Value::as_u64) {
                return Some(n);
            }
            map.values().find_map(|x| find_u64(x, key))
        }
        Value::Array(arr) => arr.iter().find_map(|x| find_u64(x, key)),
        _ => None,
    }
}

fn find_str(v: &Value, key: &str) -> Option<String> {
    match v {
        Value::Object(map) => {
            if let Some(s) = map.get(key).and_then(Value::as_str) {
                return Some(s.to_string());
            }
            map.values().find_map(|x| find_str(x, key))
        }
        Value::Array(arr) => arr.iter().find_map(|x| find_str(x, key)),
        _ => None,
    }
}

fn fnv1a_value(v: &Value) -> u64 {
    let s = v.to_string();
    let mut h: u64 = 0xcbf29ce484222325;
    for b in s.bytes() {
        h ^= b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}
