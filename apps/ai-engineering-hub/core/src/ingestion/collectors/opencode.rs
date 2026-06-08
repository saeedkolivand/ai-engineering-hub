//! OpenCode collector. OpenCode stores sessions/messages in a SQLite db at
//! `~/.local/share/opencode/opencode.db`. Assistant messages carry token counts in
//! their JSON `data` (`tokens.{input,output,reasoning,cache.{read,write}}`). We read it
//! read-only and emit `token_usage` events attributed to the session's repository + model.
use super::{home_dir, open_ro, repo_ref, CollectedEvent, Upsert};
use crate::error::{AppError, AppResult};
use chrono::{TimeZone, Utc};
use serde_json::{json, Value};
use shared_events::{EntityRefs, EventEnvelope};
use sqlx::SqlitePool;
use std::path::PathBuf;
use std::sync::atomic::{AtomicI64, Ordering};
use tokio::sync::Mutex;

#[derive(sqlx::FromRow)]
struct OcRow {
    id: String,
    session_id: String,
    time_created: i64,
    data: String,
    directory: Option<String>,
}

pub struct OpenCode {
    db_path: Option<PathBuf>,
    pool: Mutex<Option<SqlitePool>>,
    last_time: AtomicI64,
}

impl OpenCode {
    pub fn new() -> Self {
        Self {
            db_path: home_dir().map(|h| {
                h.join(".local")
                    .join("share")
                    .join("opencode")
                    .join("opencode.db")
            }),
            pool: Mutex::new(None),
            last_time: AtomicI64::new(0),
        }
    }

    pub async fn collect(&self) -> AppResult<Vec<CollectedEvent>> {
        let Some(path) = self.db_path.as_ref() else {
            return Ok(vec![]);
        };
        if !path.exists() {
            return Ok(vec![]);
        }

        let pool = {
            let mut guard = self.pool.lock().await;
            if guard.is_none() {
                match open_ro(path).await {
                    Ok(p) => *guard = Some(p),
                    Err(e) => {
                        tracing::warn!("opencode: cannot open db: {e}");
                        return Ok(vec![]);
                    }
                }
            }
            guard.as_ref().unwrap().clone()
        };

        let last = self.last_time.load(Ordering::Relaxed);
        let rows = sqlx::query_as::<_, OcRow>(
            "SELECT m.id AS id, m.session_id AS session_id, m.time_created AS time_created, \
                    m.data AS data, s.directory AS directory \
             FROM message m LEFT JOIN session s ON m.session_id = s.id \
             WHERE m.time_created > ? ORDER BY m.time_created ASC LIMIT 5000",
        )
        .bind(last)
        .fetch_all(&pool)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;

        let mut out = Vec::new();
        let mut max_time = last;
        for r in rows {
            max_time = max_time.max(r.time_created);
            let Ok(d) = serde_json::from_str::<Value>(&r.data) else {
                continue;
            };
            if d.get("role").and_then(Value::as_str) != Some("assistant") {
                continue;
            }
            let tk = d.get("tokens");
            let g = |k: &str| {
                tk.and_then(|t| t.get(k))
                    .and_then(Value::as_u64)
                    .unwrap_or(0)
            };
            let cache = tk.and_then(|t| t.get("cache"));
            let gc = |k: &str| {
                cache
                    .and_then(|c| c.get(k))
                    .and_then(Value::as_u64)
                    .unwrap_or(0)
            };
            let input = g("input");
            let output = g("output");
            let reasoning = g("reasoning");
            let cache_read = gc("read");
            let cache_write = gc("write");
            let total = input + output + reasoning + cache_read + cache_write;
            if total == 0 {
                continue;
            }

            let provider = d
                .get("providerID")
                .and_then(Value::as_str)
                .unwrap_or("unknown")
                .to_string();
            let model = d
                .get("modelID")
                .and_then(Value::as_str)
                .unwrap_or("unknown")
                .to_string();
            let ts = Utc
                .timestamp_millis_opt(r.time_created)
                .single()
                .unwrap_or_else(Utc::now);

            let agent_id = format!("agent:opencode:{provider}:{model}");
            let mut upserts = vec![Upsert::Agent {
                id: agent_id.clone(),
                name: model.clone(),
                provider: provider.clone(),
                model_id: Some(model.clone()),
            }];

            // Only reference a session once it (and its repo) are upserted — FKs are on.
            let (repository_id, session_id) = match r.directory.as_deref().filter(|s| !s.is_empty())
            {
                Some(dir) => {
                    let (repo_id, repo_name) = repo_ref(dir);
                    upserts.push(Upsert::Repository {
                        id: repo_id.clone(),
                        name: repo_name,
                        path: dir.trim_start_matches(r"\\?\").to_string(),
                    });
                    upserts.push(Upsert::Session {
                        id: r.session_id.clone(),
                        repository_id: repo_id.clone(),
                        start_time: ts.to_rfc3339(),
                    });
                    (Some(repo_id), Some(r.session_id.clone()))
                }
                None => (None, None),
            };

            let payload = json!({
                "tokens": total,
                "input_tokens": input,
                "output_tokens": output,
                "reasoning_tokens": reasoning,
                "cache_read_tokens": cache_read,
                "cache_write_tokens": cache_write,
                "model": model,
                "provider": provider,
            });

            out.push(CollectedEvent {
                dedup_id: format!("oc:{}", r.id),
                event: EventEnvelope {
                    source: "opencode".into(),
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
            });
        }
        self.last_time.store(max_time, Ordering::Relaxed);
        Ok(out)
    }
}
