//! Entity row structs + simple list queries (repository pattern).
//! Timestamps are read as strings to avoid driver datetime-format coupling.
use crate::error::AppResult;
use serde::Serialize;
use sqlx::SqlitePool;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Repository {
    pub id: String,
    pub name: String,
    pub path: String,
    pub metadata: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Session {
    pub id: String,
    pub repository_id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Task {
    pub id: String,
    pub session_id: String,
    pub description: Option<String>,
    pub status: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub model_id: Option<String>,
}

pub async fn list_repositories(pool: &SqlitePool) -> AppResult<Vec<Repository>> {
    Ok(sqlx::query_as::<_, Repository>(
        "SELECT id, name, path, metadata, created_at FROM repositories ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await?)
}

pub async fn get_repository(pool: &SqlitePool, id: &str) -> AppResult<Option<Repository>> {
    Ok(sqlx::query_as::<_, Repository>(
        "SELECT id, name, path, metadata, created_at FROM repositories WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?)
}

pub async fn list_sessions(pool: &SqlitePool, repository_id: Option<&str>) -> AppResult<Vec<Session>> {
    let rows = match repository_id {
        Some(rid) => {
            sqlx::query_as::<_, Session>(
                "SELECT id, repository_id, start_time, end_time, status FROM sessions WHERE repository_id = ? ORDER BY start_time DESC",
            )
            .bind(rid)
            .fetch_all(pool)
            .await?
        }
        None => {
            sqlx::query_as::<_, Session>(
                "SELECT id, repository_id, start_time, end_time, status FROM sessions ORDER BY start_time DESC",
            )
            .fetch_all(pool)
            .await?
        }
    };
    Ok(rows)
}

pub async fn list_tasks(pool: &SqlitePool, session_id: Option<&str>) -> AppResult<Vec<Task>> {
    let rows = match session_id {
        Some(sid) => {
            sqlx::query_as::<_, Task>(
                "SELECT id, session_id, description, status, started_at, completed_at FROM tasks WHERE session_id = ? ORDER BY started_at DESC",
            )
            .bind(sid)
            .fetch_all(pool)
            .await?
        }
        None => {
            sqlx::query_as::<_, Task>(
                "SELECT id, session_id, description, status, started_at, completed_at FROM tasks ORDER BY started_at DESC",
            )
            .fetch_all(pool)
            .await?
        }
    };
    Ok(rows)
}

pub async fn list_agents(pool: &SqlitePool) -> AppResult<Vec<Agent>> {
    Ok(sqlx::query_as::<_, Agent>(
        "SELECT id, name, provider, model_id FROM agents ORDER BY name",
    )
    .fetch_all(pool)
    .await?)
}
