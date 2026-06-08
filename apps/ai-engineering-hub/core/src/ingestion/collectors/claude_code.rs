//! Claude Code collector. Tails the session logs under `~/.claude/projects/<slug>/*.jsonl`,
//! emitting a `token_usage` event for every assistant turn (from `message.usage`), attributed
//! to the repository (from `cwd`), session (`sessionId`), and model (agent).
use super::{home_dir, provider_for, repo_ref, CollectedEvent, Upsert};
use crate::error::AppResult;
use chrono::Utc;
use serde_json::{json, Value};
use shared_events::{EntityRefs, EventEnvelope};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tokio::sync::Mutex;

pub struct ClaudeCode {
    root: Option<PathBuf>,
    /// Per-file byte offset already consumed (incremental tail; restart re-reads
    /// once but dedup makes that a no-op).
    offsets: Mutex<HashMap<PathBuf, u64>>,
}

impl ClaudeCode {
    pub fn new() -> Self {
        Self {
            root: home_dir().map(|h| h.join(".claude").join("projects")),
            offsets: Mutex::new(HashMap::new()),
        }
    }

    pub async fn collect(&self) -> AppResult<Vec<CollectedEvent>> {
        let Some(root) = self.root.as_ref() else { return Ok(vec![]) };
        if !root.exists() {
            return Ok(vec![]);
        }
        let mut files = Vec::new();
        collect_jsonl(root, &mut files).await;

        let mut out = Vec::new();
        let mut offsets = self.offsets.lock().await;
        for path in files {
            let start = offsets.get(&path).copied().unwrap_or(0);
            let Some((text, new_offset)) = read_from(&path, start).await else { continue };
            offsets.insert(path, new_offset);
            for line in text.lines() {
                let line = line.trim();
                if line.is_empty() {
                    continue;
                }
                if let Ok(v) = serde_json::from_str::<Value>(line) {
                    if let Some(ev) = parse_line(&v) {
                        out.push(ev);
                    }
                }
            }
        }
        Ok(out)
    }
}

/// Parse one JSONL record into a canonical event: assistant turns → `token_usage`,
/// user prompts → a `task` (so the Tasks list + drill-down populate). `None` otherwise.
fn parse_line(v: &Value) -> Option<CollectedEvent> {
    match v.get("type").and_then(Value::as_str) {
        Some("assistant") => parse_assistant(v),
        Some("user") => parse_user_task(v),
        _ => None,
    }
}

/// A user prompt becomes a Task (id = prompt id), attributed to its repo + session.
fn parse_user_task(v: &Value) -> Option<CollectedEvent> {
    let prompt_id = v.get("promptId").and_then(Value::as_str)?.to_string();
    let text = prompt_text(v.get("message")?)?;
    if text.trim().is_empty() {
        return None;
    }
    let cwd = v.get("cwd").and_then(Value::as_str).unwrap_or("").to_string();
    if cwd.is_empty() {
        return None; // a task needs a (NOT NULL) session → repository
    }
    let session = v.get("sessionId").and_then(Value::as_str)?.to_string();
    let ts = v
        .get("timestamp")
        .and_then(Value::as_str)
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(Utc::now);
    let (repo_id, repo_name) = repo_ref(&cwd);
    let task_id = format!("task:{prompt_id}");
    let desc: String = text.chars().take(300).collect();

    let upserts = vec![
        Upsert::Repository {
            id: repo_id.clone(),
            name: repo_name,
            path: cwd.trim_start_matches(r"\\?\").to_string(),
        },
        Upsert::Session {
            id: session.clone(),
            repository_id: repo_id.clone(),
            start_time: ts.to_rfc3339(),
        },
        Upsert::Task {
            id: task_id.clone(),
            session_id: session.clone(),
            description: desc.clone(),
            started_at: ts.to_rfc3339(),
        },
    ];

    Some(CollectedEvent {
        dedup_id: format!("cctask:{prompt_id}"),
        event: EventEnvelope {
            source: "claude-code".into(),
            event_type: "task".into(),
            timestamp: ts,
            refs: EntityRefs {
                repository_id: Some(repo_id),
                session_id: Some(session),
                task_id: Some(task_id),
                agent_id: None,
            },
            payload: json!({ "description": desc, "prompt_id": prompt_id }),
        },
        upserts,
    })
}

/// Extract the first text from a message's `content` (string or array form).
fn prompt_text(msg: &Value) -> Option<String> {
    match msg.get("content")? {
        Value::String(s) => Some(s.clone()),
        Value::Array(items) => items.iter().find_map(|it| {
            (it.get("type").and_then(Value::as_str) == Some("text"))
                .then(|| it.get("text").and_then(Value::as_str).map(String::from))
                .flatten()
        }),
        _ => None,
    }
}

/// An assistant turn with `message.usage` becomes a `token_usage` event.
fn parse_assistant(v: &Value) -> Option<CollectedEvent> {
    let msg = v.get("message")?;
    let usage = msg.get("usage")?;
    let g = |k: &str| usage.get(k).and_then(Value::as_u64).unwrap_or(0);
    let input = g("input_tokens");
    let output = g("output_tokens");
    let cache_read = g("cache_read_input_tokens");
    let cache_create = g("cache_creation_input_tokens");
    let total = input + output + cache_read + cache_create;
    if total == 0 {
        return None;
    }

    let uuid = v.get("uuid").and_then(Value::as_str)?.to_string();
    let model = msg
        .get("model")
        .and_then(Value::as_str)
        .unwrap_or("unknown")
        .to_string();
    let ts = v
        .get("timestamp")
        .and_then(Value::as_str)
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(Utc::now);
    let session = v.get("sessionId").and_then(Value::as_str).map(String::from);
    let cwd = v.get("cwd").and_then(Value::as_str).unwrap_or("").to_string();
    let provider = provider_for(&model);

    let agent_id = format!("agent:claude-code:{model}");
    let mut upserts = vec![Upsert::Agent {
        id: agent_id.clone(),
        name: model.clone(),
        provider: provider.into(),
        model_id: Some(model.clone()),
    }];

    // Only set a ref once its row is upserted — FKs are enforced, and a session
    // requires a repository (cwd). No cwd → attribute by source/agent only.
    let (repository_id, session_id) = if cwd.is_empty() {
        (None, None)
    } else {
        let (repo_id, repo_name) = repo_ref(&cwd);
        upserts.push(Upsert::Repository {
            id: repo_id.clone(),
            name: repo_name,
            path: cwd.trim_start_matches(r"\\?\").to_string(),
        });
        let sid = session.clone().map(|sid| {
            upserts.push(Upsert::Session {
                id: sid.clone(),
                repository_id: repo_id.clone(),
                start_time: ts.to_rfc3339(),
            });
            sid
        });
        (Some(repo_id), sid)
    };

    let payload = json!({
        "tokens": total,
        "input_tokens": input,
        "output_tokens": output,
        "cache_read_tokens": cache_read,
        "cache_creation_tokens": cache_create,
        "model": model,
        "provider": provider,
    });

    Some(CollectedEvent {
        dedup_id: format!("cc:{uuid}"),
        event: EventEnvelope {
            source: "claude-code".into(),
            event_type: "token_usage".into(),
            timestamp: ts,
            refs: EntityRefs {
                repository_id,
                session_id,
                task_id: None,
                agent_id: Some(agent_id),
            },
            payload,
        },
        upserts,
    })
}

/// Iteratively collect every `*.jsonl` file under `dir` (avoids async recursion).
async fn collect_jsonl(dir: &Path, out: &mut Vec<PathBuf>) {
    let mut stack = vec![dir.to_path_buf()];
    while let Some(d) = stack.pop() {
        let Ok(mut rd) = tokio::fs::read_dir(&d).await else { continue };
        while let Ok(Some(entry)) = rd.next_entry().await {
            let p = entry.path();
            match entry.file_type().await {
                Ok(ft) if ft.is_dir() => stack.push(p),
                Ok(_) if p.extension().and_then(|e| e.to_str()) == Some("jsonl") => out.push(p),
                _ => {}
            }
        }
    }
}

/// Read bytes `start..EOF`, but only up to the last newline so a partially-written
/// trailing line is left for the next poll. Returns the consumed text + new offset.
async fn read_from(path: &Path, start: u64) -> Option<(String, u64)> {
    use tokio::io::{AsyncReadExt, AsyncSeekExt};
    let len = tokio::fs::metadata(path).await.ok()?.len();
    if len <= start {
        return None;
    }
    let mut f = tokio::fs::File::open(path).await.ok()?;
    f.seek(std::io::SeekFrom::Start(start)).await.ok()?;
    let mut buf = Vec::with_capacity((len - start) as usize);
    f.read_to_end(&mut buf).await.ok()?;
    let last_nl = buf.iter().rposition(|&b| b == b'\n')?;
    let consumed = last_nl + 1;
    let text = String::from_utf8_lossy(&buf[..consumed]).into_owned();
    Some((text, start + consumed as u64))
}
