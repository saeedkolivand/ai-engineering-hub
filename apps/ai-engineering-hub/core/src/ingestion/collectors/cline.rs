//! Cline collector. Cline (VS Code extension) stores each task under
//! `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/tasks/<taskId>/ui_messages.json`.
//! `api_req_started` entries carry per-request token counts. We re-read changed task files
//! (mtime-tracked) and emit `token_usage` events; dedup keeps re-reads idempotent.
use super::{appdata_dir, CollectedEvent};
use crate::error::AppResult;
use chrono::{TimeZone, Utc};
use serde_json::{json, Value};
use shared_events::{EntityRefs, EventEnvelope};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::SystemTime;
use tokio::sync::Mutex;

pub struct Cline {
    tasks_dir: Option<PathBuf>,
    /// Per-file last-seen mtime, so unchanged task logs are skipped.
    seen: Mutex<HashMap<PathBuf, SystemTime>>,
}

impl Cline {
    pub fn new() -> Self {
        Self {
            tasks_dir: appdata_dir().map(|d| {
                d.join("Code")
                    .join("User")
                    .join("globalStorage")
                    .join("saoudrizwan.claude-dev")
                    .join("tasks")
            }),
            seen: Mutex::new(HashMap::new()),
        }
    }

    pub async fn collect(&self) -> AppResult<Vec<CollectedEvent>> {
        let Some(root) = self.tasks_dir.as_ref() else {
            return Ok(vec![]);
        };
        if !root.exists() {
            return Ok(vec![]);
        }

        let mut out = Vec::new();
        let mut seen = self.seen.lock().await;
        let Ok(mut rd) = tokio::fs::read_dir(root).await else {
            return Ok(vec![]);
        };
        while let Ok(Some(entry)) = rd.next_entry().await {
            let task_id = entry.file_name().to_string_lossy().into_owned();
            let file = entry.path().join("ui_messages.json");
            let Ok(meta) = tokio::fs::metadata(&file).await else {
                continue;
            };
            let mtime = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
            if seen.get(&file).copied() == Some(mtime) {
                continue; // unchanged since last poll
            }
            seen.insert(file.clone(), mtime);

            let Ok(content) = tokio::fs::read_to_string(&file).await else {
                continue;
            };
            let Ok(Value::Array(msgs)) = serde_json::from_str::<Value>(&content) else {
                continue;
            };
            for m in &msgs {
                if let Some(ev) = parse_msg(&task_id, m) {
                    out.push(ev);
                }
            }
        }
        Ok(out)
    }
}

fn parse_msg(task_id: &str, m: &Value) -> Option<CollectedEvent> {
    if m.get("say").and_then(Value::as_str)? != "api_req_started" {
        return None;
    }
    let ts_ms = m.get("ts").and_then(Value::as_i64)?;
    let text = m.get("text").and_then(Value::as_str)?;
    let info: Value = serde_json::from_str(text).ok()?;
    let g = |k: &str| info.get(k).and_then(Value::as_u64).unwrap_or(0);
    let tokens_in = g("tokensIn");
    let tokens_out = g("tokensOut");
    let cache_reads = g("cacheReads");
    let cache_writes = g("cacheWrites");
    let total = tokens_in + tokens_out + cache_reads + cache_writes;
    if total == 0 {
        return None;
    }
    let cost = info.get("cost").and_then(Value::as_f64).unwrap_or(0.0);
    let ts = Utc
        .timestamp_millis_opt(ts_ms)
        .single()
        .unwrap_or_else(Utc::now);

    // Cline doesn't reliably record the workspace path, and FKs are enforced, so we
    // don't fabricate a session/repo row. The task id lives in the payload for grouping;
    // token totals + the source breakdown still count.
    let payload = json!({
        "tokens": total,
        "input_tokens": tokens_in,
        "output_tokens": tokens_out,
        "cache_read_tokens": cache_reads,
        "cache_write_tokens": cache_writes,
        "cost": cost,
        "task": task_id,
    });

    Some(CollectedEvent {
        dedup_id: format!("cline:{task_id}:{ts_ms}"),
        event: EventEnvelope {
            source: "cline".into(),
            event_type: "token_usage".into(),
            timestamp: ts,
            refs: EntityRefs::default(),
            payload,
        },
        upserts: Vec::new(),
    })
}
