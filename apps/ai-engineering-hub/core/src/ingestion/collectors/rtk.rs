//! RTK collector. RTK (a token-saving CLI proxy) records every proxied command in a
//! SQLite ledger at `%LOCALAPPDATA%/rtk/history.db` (`commands` table). We read it
//! read-only and emit a `savings` event for each command that actually saved tokens,
//! attributed to the repository from `project_path`.
use super::{local_appdata_dir, open_ro, repo_ref, CollectedEvent, Upsert};
use crate::error::{AppError, AppResult};
use chrono::Utc;
use serde_json::json;
use shared_events::{EntityRefs, EventEnvelope};
use sqlx::SqlitePool;
use std::path::PathBuf;
use std::sync::atomic::{AtomicI64, Ordering};
use tokio::sync::Mutex;

#[derive(sqlx::FromRow)]
struct RtkRow {
    id: i64,
    timestamp: String,
    rtk_cmd: Option<String>,
    input_tokens: i64,
    output_tokens: i64,
    saved_tokens: i64,
    savings_pct: f64,
    project_path: Option<String>,
}

pub struct Rtk {
    db_path: Option<PathBuf>,
    pool: Mutex<Option<SqlitePool>>,
    last_id: AtomicI64,
}

impl Rtk {
    pub fn new() -> Self {
        Self {
            db_path: local_appdata_dir().map(|d| d.join("rtk").join("history.db")),
            pool: Mutex::new(None),
            last_id: AtomicI64::new(0),
        }
    }

    pub async fn collect(&self) -> AppResult<Vec<CollectedEvent>> {
        let Some(path) = self.db_path.as_ref() else { return Ok(vec![]) };
        if !path.exists() {
            return Ok(vec![]);
        }

        // Lazily open (and cache) the read-only pool.
        let pool = {
            let mut guard = self.pool.lock().await;
            if guard.is_none() {
                match open_ro(path).await {
                    Ok(p) => *guard = Some(p),
                    Err(e) => {
                        tracing::warn!("rtk: cannot open history db: {e}");
                        return Ok(vec![]);
                    }
                }
            }
            guard.as_ref().unwrap().clone()
        };

        let last = self.last_id.load(Ordering::Relaxed);
        let rows = sqlx::query_as::<_, RtkRow>(
            "SELECT id, timestamp, rtk_cmd, input_tokens, output_tokens, saved_tokens, savings_pct, project_path \
             FROM commands WHERE id > ? AND saved_tokens > 0 ORDER BY id ASC LIMIT 5000",
        )
        .bind(last)
        .fetch_all(&pool)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;

        let mut out = Vec::with_capacity(rows.len());
        let mut max_id = last;
        for r in rows {
            max_id = max_id.max(r.id);
            let ts = chrono::DateTime::parse_from_rfc3339(&r.timestamp)
                .map(|d| d.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());
            let path = r.project_path.unwrap_or_default();

            let mut upserts = Vec::new();
            let repository_id = if path.is_empty() {
                None
            } else {
                let (repo_id, repo_name) = repo_ref(&path);
                upserts.push(Upsert::Repository {
                    id: repo_id.clone(),
                    name: repo_name,
                    path: path.trim_start_matches(r"\\?\").to_string(),
                });
                Some(repo_id)
            };

            let payload = json!({
                "savings": r.saved_tokens,
                "input_tokens": r.input_tokens,
                "output_tokens": r.output_tokens,
                "savings_pct": r.savings_pct,
                "command": r.rtk_cmd,
            });

            out.push(CollectedEvent {
                dedup_id: format!("rtk:{}", r.id),
                event: EventEnvelope {
                    source: "rtk".into(),
                    event_type: "savings".into(),
                    timestamp: ts,
                    refs: EntityRefs {
                        repository_id,
                        ..Default::default()
                    },
                    payload,
                },
                upserts,
            });
        }
        self.last_id.store(max_id, Ordering::Relaxed);
        Ok(out)
    }
}
