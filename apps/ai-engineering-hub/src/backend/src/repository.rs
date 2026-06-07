use sqlx::SqlitePool;

use crate::models::{ActivityEvent, Agent, Metric, Repository, Session, Task};

// ── Repository ──────────────────────────────────────────────

pub async fn list_repositories(pool: &SqlitePool) -> anyhow::Result<Vec<Repository>> {
    let rows = sqlx::query_as::<_, Repository>(
        "SELECT id, name, path, created_at, updated_at FROM repositories ORDER BY updated_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn create_repository(pool: &SqlitePool, id: &str, name: &str, path: &str) -> anyhow::Result<Repository> {
    let repo = sqlx::query_as::<_, Repository>(
        "INSERT INTO repositories (id, name, path) VALUES (?, ?, ?) RETURNING *"
    )
    .bind(id)
    .bind(name)
    .bind(path)
    .fetch_one(pool)
    .await?;
    Ok(repo)
}

// ── Session ─────────────────────────────────────────────────

pub async fn list_sessions(pool: &SqlitePool) -> anyhow::Result<Vec<Session>> {
    let rows = sqlx::query_as::<_, Session>(
        "SELECT id, repository_id, status, started_at, ended_at, created_at FROM sessions ORDER BY started_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn list_sessions_by_repository(pool: &SqlitePool, repository_id: &str) -> anyhow::Result<Vec<Session>> {
    let rows = sqlx::query_as::<_, Session>(
        "SELECT id, repository_id, status, started_at, ended_at, created_at FROM sessions WHERE repository_id = ? ORDER BY started_at DESC"
    )
    .bind(repository_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

// ── Agent ───────────────────────────────────────────────────

pub async fn list_agents(pool: &SqlitePool) -> anyhow::Result<Vec<Agent>> {
    let rows = sqlx::query_as::<_, Agent>(
        "SELECT id, name, provider, model_id, created_at FROM agents ORDER BY name ASC"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

// ── Task ────────────────────────────────────────────────────

pub async fn list_tasks(pool: &SqlitePool) -> anyhow::Result<Vec<Task>> {
    let rows = sqlx::query_as::<_, Task>(
        "SELECT id, session_id, name, agent_id, status, started_at, completed_at, tokens_used, tokens_saved, interventions, retries, first_pass_success, created_at FROM tasks ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn list_tasks_by_session(pool: &SqlitePool, session_id: &str) -> anyhow::Result<Vec<Task>> {
    let rows = sqlx::query_as::<_, Task>(
        "SELECT id, session_id, name, agent_id, status, started_at, completed_at, tokens_used, tokens_saved, interventions, retries, first_pass_success, created_at FROM tasks WHERE session_id = ? ORDER BY created_at ASC"
    )
    .bind(session_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

// ── Metric ──────────────────────────────────────────────────

pub async fn list_metrics(pool: &SqlitePool) -> anyhow::Result<Vec<Metric>> {
    let rows = sqlx::query_as::<_, Metric>(
        "SELECT id, task_id, metric_type, value, unit, recorded_at FROM metrics ORDER BY recorded_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn get_token_usage_by_day(pool: &SqlitePool) -> anyhow::Result<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(tokens_used), 0) FROM tasks WHERE date(started_at) = date('now')"
    )
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn get_token_usage_by_week(pool: &SqlitePool) -> anyhow::Result<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(tokens_used), 0) FROM tasks WHERE started_at >= datetime('now', '-7 days')"
    )
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn get_token_usage_by_month(pool: &SqlitePool) -> anyhow::Result<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(tokens_used), 0) FROM tasks WHERE started_at >= datetime('now', '-30 days')"
    )
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn get_total_savings(pool: &SqlitePool) -> anyhow::Result<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(tokens_saved), 0) FROM tasks"
    )
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

// ── Activity Events ─────────────────────────────────────────

pub async fn list_activity_events(pool: &SqlitePool) -> anyhow::Result<Vec<ActivityEvent>> {
    let rows = sqlx::query_as::<_, ActivityEvent>(
        "SELECT id, repository_id, session_id, task_id, agent_id, event_type, description, token_impact, metadata, timestamp, created_at FROM activity_events ORDER BY timestamp DESC LIMIT 100"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}