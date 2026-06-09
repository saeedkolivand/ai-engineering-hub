//! Claude Code collector. Tails the session logs under `~/.claude/projects/<slug>/*.jsonl`,
//! emitting a `token_usage` event for every assistant turn (from `message.usage`), attributed
//! to the repository (from `cwd`), session (`sessionId`), and model (agent).
//!
//! Beyond tokens, it derives **quality + productivity signals** that the analytics
//! `quality_metrics` / `productivity_metrics` queries read from `raw_events.payload`:
//!   - `build` / `test` / `lint` events from the success of Bash tool runs whose
//!     command classifies as a build/test/lint (cargo, pnpm, pytest, eslint, …);
//!   - `intervention` events from `[Request interrupted by user]` lines.
//!
//! A Bash run spans two JSONL records: an `assistant` line carries the `tool_use`
//! (command + `id`), and a later `user` line carries the matching `tool_result`
//! (`tool_use_id` + `is_error`). Those two lines may even land in different poll
//! batches, so we keep a small bounded pairing map (`pending_tools`) keyed by
//! `tool_use_id`: the tool_use stores a [`PendingTool`]; the tool_result takes it
//! and emits. `last_test_status` per repo lets a now-failing test that was passing
//! before be flagged as a regression.
use super::{home_dir, provider_for, repo_ref, CollectedEvent, Upsert};
use crate::error::AppResult;
use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use shared_events::{EntityRefs, EventEnvelope};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tokio::sync::Mutex;

/// Cap on outstanding (unpaired) Bash tool runs we remember, so a session that
/// never produces tool_results can't grow the map without bound.
const MAX_PENDING: usize = 512;

/// Build/test/lint classification of a shell command.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Category {
    Build,
    Test,
    Lint,
}

impl Category {
    /// Canonical `event_type` + the payload status field name for this category.
    fn event_type(self) -> &'static str {
        match self {
            Category::Build => "build",
            Category::Test => "test",
            Category::Lint => "lint",
        }
    }
    fn status_field(self) -> &'static str {
        match self {
            Category::Build => "build_status",
            Category::Test => "test_status",
            Category::Lint => "lint_status",
        }
    }
    /// dedup_id prefix (`ccbuild:` / `cctest:` / `cclint:`).
    fn dedup_prefix(self) -> &'static str {
        match self {
            Category::Build => "ccbuild",
            Category::Test => "cctest",
            Category::Lint => "cclint",
        }
    }
}

/// A classified Bash run awaiting its tool_result, with the refs derived from the
/// assistant line that issued it.
struct PendingTool {
    category: Category,
    command: String,
    repository_id: Option<String>,
    /// Display name + filesystem path for the repository upsert (from the issuing
    /// assistant line's cwd). Empty when no cwd was present.
    repository_name: String,
    repository_path: String,
    session_id: Option<String>,
    ts: DateTime<Utc>,
}

pub struct ClaudeCode {
    root: Option<PathBuf>,
    /// Per-file byte offset already consumed (incremental tail; restart re-reads
    /// once but dedup makes that a no-op).
    offsets: Mutex<HashMap<PathBuf, u64>>,
    /// Bash tool runs seen on assistant lines, keyed by `tool_use_id`, awaiting the
    /// matching tool_result on a later `user` line (possibly a later poll).
    pending_tools: Mutex<HashMap<String, PendingTool>>,
    /// Last observed test outcome per repository id (`true` == passing) → regression
    /// detection when a previously-passing repo's test now fails.
    last_test_status: Mutex<HashMap<String, bool>>,
}

impl ClaudeCode {
    pub fn new() -> Self {
        Self {
            root: home_dir().map(|h| h.join(".claude").join("projects")),
            offsets: Mutex::new(HashMap::new()),
            pending_tools: Mutex::new(HashMap::new()),
            last_test_status: Mutex::new(HashMap::new()),
        }
    }

    pub async fn collect(&self) -> AppResult<Vec<CollectedEvent>> {
        let Some(root) = self.root.as_ref() else {
            return Ok(vec![]);
        };
        if !root.exists() {
            return Ok(vec![]);
        }
        let mut files = Vec::new();
        collect_jsonl(root, &mut files).await;

        // Phase 1: read new bytes under the offsets lock only. Releasing the lock
        // before derive_signals prevents holding it across the pending_tools and
        // last_test_status acquisitions inside derive_signals.
        let reads: Vec<String> = {
            let mut offsets = self.offsets.lock().await;
            let mut texts = Vec::new();
            for path in &files {
                let start = offsets.get(path).copied().unwrap_or(0);
                let Some((text, new_offset)) = read_from(path, start).await else {
                    continue;
                };
                offsets.insert(path.clone(), new_offset);
                texts.push(text);
            }
            texts
        };

        // Phase 2: parse + derive signals (no longer under the offsets lock).
        let mut out = Vec::new();
        for text in reads {
            for line in text.lines() {
                let line = line.trim();
                if line.is_empty() {
                    continue;
                }
                if let Ok(v) = serde_json::from_str::<Value>(line) {
                    if let Some(ev) = parse_line(&v) {
                        out.push(ev);
                    }
                    // Derived build/test/lint/intervention signals (uses pairing state).
                    self.derive_signals(&v, &mut out).await;
                }
            }
        }
        Ok(out)
    }

    /// Inspect one JSONL record for derived quality/productivity signals:
    ///
    /// - an assistant Bash `tool_use` that classifies → remember it (emit nothing);
    /// - a user `tool_result` for a remembered run → emit build/test/lint;
    /// - a `[Request interrupted by user]` line → emit `intervention`.
    ///
    /// Best-effort: anything unrecognized is silently skipped.
    async fn derive_signals(&self, v: &Value, out: &mut Vec<CollectedEvent>) {
        match v.get("type").and_then(Value::as_str) {
            Some("assistant") => self.note_tool_uses(v).await,
            Some("user") => {
                if let Some(ev) = self.resolve_tool_results(v).await {
                    out.extend(ev);
                }
                if let Some(ev) = intervention_event(v) {
                    out.push(ev);
                }
            }
            _ => {}
        }
    }

    /// Record every classifiable Bash `tool_use` on an assistant line into the
    /// pending map, keyed by its `tool_use_id`.
    async fn note_tool_uses(&self, v: &Value) {
        let Some(content) = v
            .get("message")
            .and_then(|m| m.get("content"))
            .and_then(Value::as_array)
        else {
            return;
        };
        let ts = parse_ts(v);
        let cwd = v.get("cwd").and_then(Value::as_str).unwrap_or("");
        let (repository_id, repository_name, repository_path) = if cwd.is_empty() {
            (None, String::new(), String::new())
        } else {
            let (rid, rname) = repo_ref(cwd);
            (
                Some(rid),
                rname,
                cwd.trim_start_matches(r"\\?\").to_string(),
            )
        };
        let session_id = v.get("sessionId").and_then(Value::as_str).map(String::from);

        let mut pending = self.pending_tools.lock().await;
        for block in content {
            if block.get("type").and_then(Value::as_str) != Some("tool_use") {
                continue;
            }
            if block.get("name").and_then(Value::as_str) != Some("Bash") {
                continue;
            }
            let Some(id) = block.get("id").and_then(Value::as_str) else {
                continue;
            };
            let Some(command) = block
                .get("input")
                .and_then(|i| i.get("command"))
                .and_then(Value::as_str)
            else {
                continue;
            };
            let Some(category) = classify_cmd(command) else {
                continue;
            };
            // Bound memory: if full, drop the oldest pending run before inserting.
            if pending.len() >= MAX_PENDING && !pending.contains_key(id) {
                if let Some(oldest) = pending
                    .iter()
                    .min_by_key(|(_, p)| p.ts)
                    .map(|(k, _)| k.clone())
                {
                    pending.remove(&oldest);
                }
            }
            pending.insert(
                id.to_string(),
                PendingTool {
                    category,
                    command: command.to_string(),
                    repository_id: repository_id.clone(),
                    repository_name: repository_name.clone(),
                    repository_path: repository_path.clone(),
                    session_id: session_id.clone(),
                    ts,
                },
            );
        }
    }

    /// For each `tool_result` block on a user line that matches a pending Bash run,
    /// take it and emit the corresponding build/test/lint event.
    async fn resolve_tool_results(&self, v: &Value) -> Option<Vec<CollectedEvent>> {
        let content = v
            .get("message")
            .and_then(|m| m.get("content"))
            .and_then(Value::as_array)?;
        // A `toolUseResult.interrupted == true` sibling marks the whole turn as
        // interrupted (no real exit status), so the run isn't a genuine failure.
        let interrupted = v
            .get("toolUseResult")
            .and_then(|r| r.get("interrupted"))
            .and_then(Value::as_bool)
            .unwrap_or(false);

        let mut events = Vec::new();
        let mut pending = self.pending_tools.lock().await;
        for block in content {
            if block.get("type").and_then(Value::as_str) != Some("tool_result") {
                continue;
            }
            let Some(id) = block.get("tool_use_id").and_then(Value::as_str) else {
                continue;
            };
            let Some(p) = pending.remove(id) else {
                continue;
            };
            let is_error = block
                .get("is_error")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let success = !is_error && !interrupted;
            events.push(self.build_signal_event(id, &p, success).await);
        }
        (!events.is_empty()).then_some(events)
    }

    /// Build a build/test/lint `CollectedEvent` from a resolved pending run.
    /// For `test`, computes `regression` against `last_test_status[repo]` and
    /// updates it.
    async fn build_signal_event(
        &self,
        tool_use_id: &str,
        p: &PendingTool,
        success: bool,
    ) -> CollectedEvent {
        let status = if success { "success" } else { "failure" };
        let mut payload = json!({
            p.category.status_field(): status,
            "command": p.command,
        });

        if p.category == Category::Test {
            // Regression iff the repo's previous test was passing and now fails.
            let regression = if let Some(repo) = p.repository_id.as_deref() {
                let mut last = self.last_test_status.lock().await;
                let was_passing = last.get(repo).copied();
                last.insert(repo.to_string(), success);
                matches!(was_passing, Some(true)) && !success
            } else {
                false
            };
            payload["regression"] = json!(if regression { "true" } else { "false" });
        }

        let upserts = signal_upserts(p);
        CollectedEvent {
            dedup_id: format!("{}:{}", p.category.dedup_prefix(), tool_use_id),
            event: EventEnvelope {
                source: "claude-code".into(),
                event_type: p.category.event_type().into(),
                timestamp: p.ts,
                refs: EntityRefs {
                    repository_id: p.repository_id.clone(),
                    session_id: p.session_id.clone(),
                    task_id: None,
                    agent_id: None,
                },
                payload,
            },
            upserts,
        }
    }
}

/// Classify a shell command into a build/test/lint category (first match wins).
/// Lint runners (clippy, eslint, ruff, golangci-lint, tsc) take priority over the
/// build/test verbs they may co-occur with; test runners next; build/compile last.
/// Unrecognized → `None` (skipped). The match is on substrings of the (possibly
/// chained / `rtk`-prefixed) command, lowercased.
fn classify_cmd(cmd: &str) -> Option<Category> {
    let c = cmd.to_ascii_lowercase();
    let has = |needle: &str| c.contains(needle);

    // Lint first: clippy/eslint/ruff/tsc/golangci-lint are unambiguous lint signals.
    if has("clippy")
        || has("eslint")
        || has("golangci-lint")
        || has(" ruff")
        || c.starts_with("ruff")
        || has("tsc")
        || has(" lint")
    {
        return Some(Category::Lint);
    }

    // Test runners.
    if has("pytest")
        || has("vitest")
        || has("jest")
        || has("cargo test")
        || has("cargo nextest")
        || has("go test")
        || has(" test")
    {
        return Some(Category::Test);
    }

    // Build / compile.
    if has("cargo build")
        || has("cargo check")
        || has("go build")
        || has("tsc ")
        || has(" build")
        || has("compile")
    {
        return Some(Category::Build);
    }

    None
}

/// Upserts needed so a derived signal's refs satisfy FK constraints: a repository,
/// and (if known) its session. Mirrors the token/task path.
fn signal_upserts(p: &PendingTool) -> Vec<Upsert> {
    let mut upserts = Vec::new();
    if let Some(repo_id) = p.repository_id.as_ref() {
        upserts.push(Upsert::Repository {
            id: repo_id.clone(),
            name: p.repository_name.clone(),
            path: p.repository_path.clone(),
        });
        if let Some(sid) = p.session_id.as_ref() {
            upserts.push(Upsert::Session {
                id: sid.clone(),
                repository_id: repo_id.clone(),
                start_time: p.ts.to_rfc3339(),
            });
        }
    }
    upserts
}

/// A `[Request interrupted by user…]` user line → an `intervention` event. Deterministic
/// dedup_id from the line's `uuid`. Refs come from the line's cwd/session when present.
fn intervention_event(v: &Value) -> Option<CollectedEvent> {
    let content = v
        .get("message")
        .and_then(|m| m.get("content"))
        .and_then(Value::as_array);
    let text = content.and_then(|c| {
        c.iter().find_map(|b| {
            (b.get("type").and_then(Value::as_str) == Some("text"))
                .then(|| b.get("text").and_then(Value::as_str))
                .flatten()
        })
    });
    // Only the explicit "[Request interrupted by user…]" text line is a user
    // intervention. toolUseResult.interrupted on a tool_result line is already
    // captured as a failure by resolve_tool_results — emitting a separate
    // intervention for it would double-count interruptions in the analytics.
    let interrupted_marker = text
        .map(|t| t.trim().starts_with("[Request interrupted by user"))
        .unwrap_or(false);
    if !interrupted_marker {
        return None;
    }

    // dedup must be deterministic from the line.
    let uuid = v
        .get("uuid")
        .and_then(Value::as_str)
        .map(String::from)
        .or_else(|| {
            content
                .and_then(|c| {
                    c.iter()
                        .find_map(|b| b.get("tool_use_id").and_then(Value::as_str))
                })
                .map(String::from)
        });
    let uuid = match uuid {
        Some(u) => u,
        None => {
            tracing::warn!("claude-code: intervention line has no uuid or tool_use_id — skipped");
            return None;
        }
    };

    let ts = parse_ts(v);
    let cwd = v.get("cwd").and_then(Value::as_str).unwrap_or("");
    let mut upserts = Vec::new();
    let (repository_id, session_id) = if cwd.is_empty() {
        (None, None)
    } else {
        let (rid, rname) = repo_ref(cwd);
        upserts.push(Upsert::Repository {
            id: rid.clone(),
            name: rname,
            path: cwd.trim_start_matches(r"\\?\").to_string(),
        });
        let sid = v.get("sessionId").and_then(Value::as_str).map(|s| {
            upserts.push(Upsert::Session {
                id: s.to_string(),
                repository_id: rid.clone(),
                start_time: ts.to_rfc3339(),
            });
            s.to_string()
        });
        (Some(rid), sid)
    };

    let reason = text
        .map(|t| {
            t.trim()
                .trim_start_matches('[')
                .trim_end_matches(']')
                .to_string()
        })
        .unwrap_or_else(|| "Request interrupted by user".to_string());

    Some(CollectedEvent {
        dedup_id: format!("ccint:{uuid}"),
        event: EventEnvelope {
            source: "claude-code".into(),
            event_type: "intervention".into(),
            timestamp: ts,
            refs: EntityRefs {
                repository_id,
                session_id,
                task_id: None,
                agent_id: None,
            },
            payload: json!({ "reason": reason }),
        },
        upserts,
    })
}

/// Parse a record's RFC3339 `timestamp`, defaulting to now.
fn parse_ts(v: &Value) -> DateTime<Utc> {
    v.get("timestamp")
        .and_then(Value::as_str)
        .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(Utc::now)
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
    let cwd = v
        .get("cwd")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    if cwd.is_empty() {
        return None; // a task needs a (NOT NULL) session → repository
    }
    let session = v.get("sessionId").and_then(Value::as_str)?.to_string();
    let ts = parse_ts(v);
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
    let ts = parse_ts(v);
    let session = v.get("sessionId").and_then(Value::as_str).map(String::from);
    let cwd = v
        .get("cwd")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
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
        let Ok(mut rd) = tokio::fs::read_dir(&d).await else {
            continue;
        };
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

#[cfg(test)]
impl ClaudeCode {
    /// Test driver: run the same per-line dispatch `collect()` uses over an
    /// in-memory slice of JSONL lines (no filesystem), so the pairing state and
    /// derived-signal logic can be asserted directly.
    async fn drive(&self, lines: &[&str]) -> Vec<CollectedEvent> {
        let mut out = Vec::new();
        for line in lines {
            let v: Value = serde_json::from_str(line).expect("valid json fixture line");
            if let Some(ev) = parse_line(&v) {
                out.push(ev);
            }
            self.derive_signals(&v, &mut out).await;
        }
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ---- Scrubbed fixtures (real Claude Code JSONL shapes; cwd → /repo, ids
    // simplified, no usernames/home dirs). assistant lines carry a Bash tool_use;
    // user lines carry the matching tool_result + a toolUseResult sibling.

    fn assistant_bash(tool_id: &str, command: &str) -> String {
        json!({
            "type": "assistant",
            "uuid": format!("a-{tool_id}"),
            "timestamp": "2026-06-08T18:48:07.811Z",
            "cwd": "/repo",
            "sessionId": "sess-1",
            "message": {
                "role": "assistant",
                "model": "claude-opus-4-8",
                "content": [
                    { "type": "tool_use", "id": tool_id, "name": "Bash",
                      "input": { "command": command, "description": "run" } }
                ]
            }
        })
        .to_string()
    }

    fn user_result(tool_id: &str, is_error: bool, interrupted: bool) -> String {
        json!({
            "type": "user",
            "uuid": format!("u-{tool_id}"),
            "timestamp": "2026-06-08T18:48:14.784Z",
            "cwd": "/repo",
            "sessionId": "sess-1",
            "message": {
                "role": "user",
                "content": [
                    { "type": "tool_result", "tool_use_id": tool_id,
                      "content": "output", "is_error": is_error }
                ]
            },
            "toolUseResult": { "stdout": "out", "stderr": "", "interrupted": interrupted }
        })
        .to_string()
    }

    fn interrupt_line(uuid: &str) -> String {
        json!({
            "type": "user",
            "uuid": uuid,
            "timestamp": "2026-06-08T18:53:29.230Z",
            "cwd": "/repo",
            "sessionId": "sess-1",
            "message": {
                "role": "user",
                "content": [ { "type": "text", "text": "[Request interrupted by user for tool use]" } ]
            }
        })
        .to_string()
    }

    /// Find the first event of a given `event_type`.
    fn find<'a>(evs: &'a [CollectedEvent], ty: &str) -> Option<&'a CollectedEvent> {
        evs.iter().find(|e| e.event.event_type == ty)
    }

    #[test]
    fn classify_cmd_covers_common_tools() {
        use Category::*;
        assert_eq!(classify_cmd("cargo build --workspace"), Some(Build));
        assert_eq!(classify_cmd("cargo check"), Some(Build));
        assert_eq!(classify_cmd("go build ./..."), Some(Build));
        assert_eq!(classify_cmd("cargo test -p aeh-core"), Some(Test));
        assert_eq!(classify_cmd("pnpm test"), Some(Test));
        assert_eq!(classify_cmd("pytest -q"), Some(Test));
        assert_eq!(classify_cmd("npx vitest run"), Some(Test));
        assert_eq!(classify_cmd("cargo clippy --all"), Some(Lint));
        assert_eq!(classify_cmd("npx eslint ."), Some(Lint));
        assert_eq!(classify_cmd("ruff check ."), Some(Lint));
        assert_eq!(classify_cmd("pnpm lint"), Some(Lint));
        assert_eq!(classify_cmd("ls -la"), None);
        assert_eq!(classify_cmd("git status"), None);
    }

    #[tokio::test]
    async fn passing_build_emits_success() {
        let cc = ClaudeCode::new();
        let evs = cc
            .drive(&[
                &assistant_bash("toolu_b1", "cargo build --workspace"),
                &user_result("toolu_b1", false, false),
            ])
            .await;
        let b = find(&evs, "build").expect("build event");
        assert_eq!(b.event.payload["build_status"], "success");
        assert_eq!(b.dedup_id, "ccbuild:toolu_b1");
    }

    #[tokio::test]
    async fn failing_build_emits_failure() {
        let cc = ClaudeCode::new();
        let evs = cc
            .drive(&[
                &assistant_bash("toolu_b2", "cargo build"),
                &user_result("toolu_b2", true, false),
            ])
            .await;
        let b = find(&evs, "build").expect("build event");
        assert_eq!(b.event.payload["build_status"], "failure");
    }

    #[tokio::test]
    async fn interrupted_run_is_not_success() {
        let cc = ClaudeCode::new();
        let evs = cc
            .drive(&[
                &assistant_bash("toolu_b3", "cargo build"),
                &user_result("toolu_b3", false, true),
            ])
            .await;
        let b = find(&evs, "build").expect("build event");
        assert_eq!(b.event.payload["build_status"], "failure");
    }

    #[tokio::test]
    async fn passing_then_failing_test_flags_regression() {
        let cc = ClaudeCode::new();
        // First: a passing test for the repo.
        let first = cc
            .drive(&[
                &assistant_bash("toolu_t1", "cargo test -p aeh-core"),
                &user_result("toolu_t1", false, false),
            ])
            .await;
        let t1 = find(&first, "test").expect("first test event");
        assert_eq!(t1.event.payload["test_status"], "success");
        assert_eq!(t1.event.payload["regression"], "false");

        // Then: a failing test for the SAME repo → regression.
        let second = cc
            .drive(&[
                &assistant_bash("toolu_t2", "cargo test -p aeh-core"),
                &user_result("toolu_t2", true, false),
            ])
            .await;
        let t2 = find(&second, "test").expect("second test event");
        assert_eq!(t2.event.payload["test_status"], "failure");
        assert_eq!(t2.event.payload["regression"], "true");
    }

    #[tokio::test]
    async fn interrupt_line_emits_intervention() {
        let cc = ClaudeCode::new();
        let evs = cc.drive(&[&interrupt_line("uuid-int-1")]).await;
        let i = find(&evs, "intervention").expect("intervention event");
        assert_eq!(i.dedup_id, "ccint:uuid-int-1");
        assert!(i.event.payload["reason"]
            .as_str()
            .unwrap()
            .contains("interrupted by user"));
    }

    #[tokio::test]
    async fn dedup_ids_are_deterministic() {
        let lines = [
            assistant_bash("toolu_d1", "cargo build"),
            user_result("toolu_d1", false, false),
            interrupt_line("uuid-d2"),
        ];
        let refs: Vec<&str> = lines.iter().map(String::as_str).collect();

        let ids = |evs: &[CollectedEvent]| -> Vec<String> {
            evs.iter().map(|e| e.dedup_id.clone()).collect()
        };
        let a = ClaudeCode::new().drive(&refs).await;
        let b = ClaudeCode::new().drive(&refs).await;
        assert_eq!(ids(&a), ids(&b));
        assert!(ids(&a).contains(&"ccbuild:toolu_d1".to_string()));
        assert!(ids(&a).contains(&"ccint:uuid-d2".to_string()));
    }

    /// A tool_use and its tool_result arriving in SEPARATE drive() calls (mimicking
    /// two poll batches) must still pair via the persistent pending map.
    #[tokio::test]
    async fn pairing_survives_across_polls() {
        let cc = ClaudeCode::new();
        let p1 = cc
            .drive(&[&assistant_bash("toolu_p1", "cargo build")])
            .await;
        assert!(
            find(&p1, "build").is_none(),
            "no event until result arrives"
        );
        let p2 = cc.drive(&[&user_result("toolu_p1", false, false)]).await;
        let b = find(&p2, "build").expect("build event after result");
        assert_eq!(b.event.payload["build_status"], "success");
    }
}
