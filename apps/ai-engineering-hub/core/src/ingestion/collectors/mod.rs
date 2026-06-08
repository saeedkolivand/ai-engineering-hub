//! Pull-based collectors: the piece that makes *enabling* an integration actually
//! produce data. Each collector reads a tool's own local data store (JSONL logs,
//! SQLite DBs, per-task JSON) and returns canonical [`CollectedEvent`]s. A single
//! background loop ([`spawn`]) polls every enabled source's collector, applies the
//! events idempotently (dedup by a deterministic id), upserts the drill-down
//! entities, and broadcasts the new events over the WebSocket.
//!
//! Sources stay data, not code: collectors only run for sources the user has
//! enabled in the registry, and a tool with no local data simply yields nothing.
pub mod claude_code;
pub mod cline;
pub mod gemini;
pub mod opencode;
pub mod rtk;

use crate::error::{AppError, AppResult};
use crate::sources;
use crate::state::SharedState;
use shared_events::{EventEnvelope, HubEvent};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::{Path, PathBuf};
use std::time::Duration;

/// How often the loop polls each enabled collector.
const POLL: Duration = Duration::from_secs(5);

/// A canonical event ready to persist, with the drill-down rows it implies.
pub struct CollectedEvent {
    /// Deterministic id (e.g. `cc:<uuid>`, `rtk:<id>`) → `INSERT OR IGNORE` makes
    /// re-scans and restarts idempotent.
    pub dedup_id: String,
    pub event: EventEnvelope,
    /// Repository / session / agent rows to ensure exist for drill-down.
    pub upserts: Vec<Upsert>,
}

/// Entity rows a collector wants to exist (idempotent inserts).
pub enum Upsert {
    Repository {
        id: String,
        name: String,
        path: String,
    },
    Session {
        id: String,
        repository_id: String,
        start_time: String,
    },
    Task {
        id: String,
        session_id: String,
        description: String,
        started_at: String,
    },
    Agent {
        id: String,
        name: String,
        provider: String,
        model_id: Option<String>,
    },
}

impl Upsert {
    async fn exec(&self, pool: &SqlitePool) -> AppResult<()> {
        match self {
            Upsert::Repository { id, name, path } => {
                sqlx::query("INSERT OR IGNORE INTO repositories (id, name, path) VALUES (?, ?, ?)")
                    .bind(id)
                    .bind(name)
                    .bind(path)
                    .execute(pool)
                    .await?;
            }
            Upsert::Session {
                id,
                repository_id,
                start_time,
            } => {
                sqlx::query(
                    "INSERT OR IGNORE INTO sessions (id, repository_id, start_time, status) VALUES (?, ?, ?, 'active')",
                )
                .bind(id)
                .bind(repository_id)
                .bind(start_time)
                .execute(pool)
                .await?;
            }
            Upsert::Task {
                id,
                session_id,
                description,
                started_at,
            } => {
                sqlx::query(
                    "INSERT OR IGNORE INTO tasks (id, session_id, description, status, started_at) VALUES (?, ?, ?, 'completed', ?)",
                )
                .bind(id)
                .bind(session_id)
                .bind(description)
                .bind(started_at)
                .execute(pool)
                .await?;
            }
            Upsert::Agent {
                id,
                name,
                provider,
                model_id,
            } => {
                sqlx::query("INSERT OR IGNORE INTO agents (id, name, provider, model_id) VALUES (?, ?, ?, ?)")
                    .bind(id)
                    .bind(name)
                    .bind(provider)
                    .bind(model_id)
                    .execute(pool)
                    .await?;
            }
        }
        Ok(())
    }
}

/// User home directory (cross-platform), used to locate well-known tool data dirs.
pub fn home_dir() -> Option<PathBuf> {
    std::env::var_os("USERPROFILE")
        .or_else(|| std::env::var_os("HOME"))
        .map(PathBuf::from)
}

/// Windows roaming app-data dir (`%APPDATA%`), where VS Code extension storage lives.
pub fn appdata_dir() -> Option<PathBuf> {
    std::env::var_os("APPDATA").map(PathBuf::from)
}

/// Windows local app-data dir (`%LOCALAPPDATA%`), where rtk keeps its history db.
pub fn local_appdata_dir() -> Option<PathBuf> {
    std::env::var_os("LOCALAPPDATA").map(PathBuf::from)
}

/// Derive a stable, path-free repository id + display name from a working dir.
/// The id is a hash so the local API never exposes a filesystem path as an id.
pub fn repo_ref(path: &str) -> (String, String) {
    let clean = path.trim_start_matches(r"\\?\");
    let name = Path::new(clean)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(clean)
        .to_string();
    (format!("repo:{:016x}", fnv1a(clean)), name)
}

fn fnv1a(s: &str) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in s.bytes() {
        h ^= b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}

/// Best-effort provider inference from a model id, so `provider` is a meaningful
/// analytics dimension even when a tool routes to many model families.
pub fn provider_for(model: &str) -> &'static str {
    let m = model.to_ascii_lowercase();
    if m.starts_with("claude") {
        "anthropic"
    } else if m.contains("gemini") || m.contains("gemma") {
        "google"
    } else if m.contains("gpt") || m.starts_with("o1") || m.starts_with("o3") {
        "openai"
    } else if m.contains("deepseek") {
        "deepseek"
    } else if m.contains("qwen") {
        "qwen"
    } else if m.contains("llama") {
        "meta"
    } else if m.contains("mistral") || m.contains("mixtral") {
        "mistral"
    } else {
        "other"
    }
}

/// Open a read-only pool against another tool's SQLite database (rtk, opencode).
/// Read-only + WAL means we never interfere with the owning tool.
pub(crate) async fn open_ro(path: &Path) -> AppResult<SqlitePool> {
    let opts = SqliteConnectOptions::new().filename(path).read_only(true);
    SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(opts)
        .await
        .map_err(|e| AppError::Internal(e.into()))
}

/// Start the background collection loop. Spawned from `run()` (not `bootstrap`,
/// so the smoke example and tests stay collector-free).
pub fn spawn(state: SharedState) {
    tokio::spawn(async move {
        let claude = claude_code::ClaudeCode::new();
        let rtk = rtk::Rtk::new();
        let opencode = opencode::OpenCode::new();
        let cline = cline::Cline::new();
        let gemini = gemini::Gemini::new();
        tracing::info!("collectors started (poll every {}s)", POLL.as_secs());
        loop {
            if enabled(&state, "claude-code").await {
                run_one(&state, "claude-code", claude.collect().await).await;
            }
            if enabled(&state, "rtk").await {
                run_one(&state, "rtk", rtk.collect().await).await;
            }
            if enabled(&state, "opencode").await {
                run_one(&state, "opencode", opencode.collect().await).await;
            }
            if enabled(&state, "cline").await {
                run_one(&state, "cline", cline.collect().await).await;
            }
            if enabled(&state, "gemini-cli").await {
                run_one(&state, "gemini-cli", gemini.collect().await).await;
            }
            tokio::time::sleep(POLL).await;
        }
    });
}

async fn enabled(state: &SharedState, key: &str) -> bool {
    sources::is_enabled(&state.pool, key).await.unwrap_or(false)
}

async fn run_one(state: &SharedState, key: &str, collected: AppResult<Vec<CollectedEvent>>) {
    match collected {
        Ok(events) if !events.is_empty() => match apply(state, key, events).await {
            Ok(n) if n > 0 => tracing::info!("collector {key}: ingested {n} new event(s)"),
            Ok(_) => {}
            Err(e) => tracing::warn!("collector {key}: apply failed: {e}"),
        },
        Ok(_) => {}
        Err(e) => tracing::warn!("collector {key}: collect failed: {e}"),
    }
}

/// Persist a collector's events idempotently and broadcast the new ones.
async fn apply(
    state: &SharedState,
    source_key: &str,
    events: Vec<CollectedEvent>,
) -> AppResult<usize> {
    let source_id = sources::resolve(&state.pool, source_key).await?;
    let mut new = 0i64;
    for ce in events {
        for up in &ce.upserts {
            up.exec(&state.pool).await?;
        }
        let res = sqlx::query(
            "INSERT OR IGNORE INTO raw_events \
             (id, timestamp, source, source_id, event_type, payload, repository_id, session_id, task_id, agent_id) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&ce.dedup_id)
        .bind(ce.event.timestamp.to_rfc3339())
        .bind(source_key)
        .bind(&source_id)
        .bind(&ce.event.event_type)
        .bind(ce.event.payload.to_string())
        .bind(&ce.event.refs.repository_id)
        .bind(&ce.event.refs.session_id)
        .bind(&ce.event.refs.task_id)
        .bind(&ce.event.refs.agent_id)
        .execute(&state.pool)
        .await?;
        if res.rows_affected() > 0 {
            new += 1;
            let _ = state.tx.send(HubEvent::Event(ce.event));
        }
    }
    if new > 0 {
        sources::record_seen(&state.pool, &source_id, new).await?;
    }
    Ok(new as usize)
}
