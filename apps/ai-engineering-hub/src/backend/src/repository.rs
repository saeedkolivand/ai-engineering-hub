use sqlx::SqlitePool;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Repository {
    pub id: String,
    pub name: String,
    pub path: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Session {
    pub id: String,
    pub repository_id: String,
    pub status: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Task {
    pub id: String,
    pub session_id: String,
    pub name: String,
    pub status: String,
    pub tokens_used: Option<i64>,
    pub tokens_saved: Option<i64>,
    pub interventions: Option<i64>,
    pub retries: Option<i64>,
    pub first_pass_success: Option<i64>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub model_id: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Metric {
    pub id: String,
    pub task_id: Option<String>,
    pub metric_type: String,
    pub value: f64,
    pub unit: Option<String>,
    pub recorded_at: String,
}

use sqlx::Row;

// Implementations – fetch data from SQLite tables.
pub async fn list_metrics(pool: &SqlitePool) -> Result<Vec<Metric>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, task_id, metric_type, value, unit, recorded_at FROM metrics ORDER BY recorded_at DESC",
    )
    .fetch_all(pool)
    .await?;
    let metrics = rows
        .into_iter()
        .map(|r| Metric {
            id: r.get("id"),
            task_id: r.get("task_id"),
            metric_type: r.get("metric_type"),
            value: r.get("value"),
            unit: r.get("unit"),
            recorded_at: r.get("recorded_at"),
        })
        .collect();
    Ok(metrics)
}

pub async fn list_repositories(pool: &SqlitePool) -> Result<Vec<Repository>, sqlx::Error> {
    let rows = sqlx::query("SELECT id, name, path, created_at, updated_at FROM repositories")
        .fetch_all(pool)
        .await?;
    let repos = rows
        .into_iter()
        .map(|r| Repository {
            id: r.get("id"),
            name: r.get("name"),
            path: r.get("path"),
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        })
        .collect();
    Ok(repos)
}

pub async fn list_sessions(pool: &SqlitePool) -> Result<Vec<Session>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, repository_id, status, started_at, ended_at, created_at FROM sessions",
    )
    .fetch_all(pool)
    .await?;
    let sessions = rows
        .into_iter()
        .map(|r| Session {
            id: r.get("id"),
            repository_id: r.get("repository_id"),
            status: r.get("status"),
            started_at: r.get("started_at"),
            ended_at: r.get("ended_at"),
            created_at: r.get("created_at"),
        })
        .collect();
    Ok(sessions)
}

pub async fn list_tasks(pool: &SqlitePool) -> Result<Vec<Task>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, session_id, name, status, tokens_used, tokens_saved, interventions, retries, first_pass_success, created_at FROM tasks",
    )
    .fetch_all(pool)
    .await?;
    let tasks = rows
        .into_iter()
        .map(|r| Task {
            id: r.get("id"),
            session_id: r.get("session_id"),
            name: r.get("name"),
            status: r.get("status"),
            tokens_used: r.get("tokens_used"),
            tokens_saved: r.get("tokens_saved"),
            interventions: r.get("interventions"),
            retries: r.get("retries"),
            first_pass_success: r.get("first_pass_success"),
            created_at: r.get("created_at"),
        })
        .collect();
    Ok(tasks)
}

pub async fn list_agents(pool: &SqlitePool) -> Result<Vec<Agent>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, name, provider, model_id, created_at FROM agents",
    )
    .fetch_all(pool)
    .await?;
    let agents = rows
        .into_iter()
        .map(|r| Agent {
            id: r.get("id"),
            name: r.get("name"),
            provider: r.get("provider"),
            model_id: r.get("model_id"),
            created_at: r.get("created_at"),
        })
        .collect();
    Ok(agents)
}

// Analytics – aggregate token usage and savings.
pub async fn get_token_usage_by_day(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    let row = sqlx::query("SELECT COALESCE(SUM(tokens_used), 0) as total FROM metrics WHERE date(created_at) = date('now')")
        .fetch_one(pool)
        .await?;
    Ok(row.get::<i64, _>("total"))
}
pub async fn get_token_usage_by_week(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    let row = sqlx::query("SELECT COALESCE(SUM(tokens_used), 0) as total FROM metrics WHERE strftime('%W', created_at) = strftime('%W','now')")
        .fetch_one(pool)
        .await?;
    Ok(row.get::<i64, _>("total"))
}
pub async fn get_token_usage_by_month(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    let row = sqlx::query("SELECT COALESCE(SUM(tokens_used), 0) as total FROM metrics WHERE strftime('%m', created_at) = strftime('%m','now')")
        .fetch_one(pool)
        .await?;
    Ok(row.get::<i64, _>("total"))
}
pub async fn get_total_savings(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    let row = sqlx::query("SELECT COALESCE(SUM(tokens_saved), 0) as total FROM metrics")
        .fetch_one(pool)
        .await?;
    Ok(row.get::<i64, _>("total"))
}
