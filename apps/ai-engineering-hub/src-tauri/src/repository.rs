use sqlx::SqlitePool;
use anyhow::{Result, anyhow};
use serde_json::Value;

/// Represents daily token usage across repositories, providers, and agents.
#[derive(Debug, sqlx::FromRow)]
struct TokenUsage {
    day: String,
    repository: String,
    provider: String,
    agent: String,
    total_tokens: i64,
}

/// Represents weekly token usage across repositories, providers, and agents.
#[derive(Debug, sqlx::FromRow)]
struct WeeklyTokenUsage {
    week: String,
    repository: String,
    provider: String,
    agent: String,
    total_tokens: i64,
}

/// Represents monthly token usage across repositories, providers, and agents.
#[derive(Debug, sqlx::FromRow)]
struct MonthlyTokenUsage {
    month: String,
    repository: String,
    provider: String,
    agent: String,
    total_tokens: i64,
}

/// Represents savings metrics across RTK, Graphify, and CodeGraph.
#[derive(Debug, sqlx::FromRow)]
struct SavingsMetrics {
    rtk_savings: i64,
    graphify_savings: i64,
    codegraph_savings: i64,
    total_savings: i64,
}

/// Represents productivity metrics.
#[derive(Debug, sqlx::FromRow)]
struct ProductivityMetrics {
    first_pass_success: f64,
    intervention_rate: f64,
    retry_rate: f64,
    task_completion_rate: f64,
    build_success_rate: f64,
    test_success_rate: f64,
}

/// Represents quality metrics.
#[derive(Debug, sqlx::FromRow)]
struct QualityMetrics {
    build_success_rate: f64,
    test_success_rate: f64,
    lint_success_rate: f64,
    regression_rate: f64,
}

/// Represents retrieval metrics.
#[derive(Debug, sqlx::FromRow)]
struct RetrievalMetrics {
    accuracy: f64,
    latency: f64,
    savings: f64,
}

/// Fetches a list of all repositories from the database.
pub async fn list_repositories(pool: &SqlitePool) -> Result<Value> {
    let rows = sqlx::query!("SELECT id, name, path, metadata, created_at FROM repositories")
        .fetch_all(pool)
        .await
        .map_err(|e| anyhow!("Database error: {}", e))?;

    let repos: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|r| {
            serde_json::json!({
                "id": r.id,
                "name": r.name,
                "path": r.path,
                "metadata": r.metadata,
                "created_at": r.created_at
            })
        })
        .collect();

    Ok(serde_json::json!(repos))
}

/// Fetches daily token usage metrics from the database.
pub async fn get_token_usage_by_day(pool: &SqlitePool) -> Result<Vec<TokenUsage>> {
    let query = r#"
        SELECT
            DATE(raw_events.timestamp) AS day,
            repositories.name AS repository,
            agents.provider,
            agents.name AS agent,
            SUM(json_extract(raw_events.payload, '$.tokens')) AS total_tokens
        FROM raw_events
        LEFT JOIN repositories ON raw_events.repository_id = repositories.id
        LEFT JOIN agents ON raw_events.agent_id = agents.id
        WHERE raw_events.event_type = 'token_usage'
        GROUP BY day, repositories.name, agents.provider, agents.name
        ORDER BY day DESC
    "#;

    let rows = sqlx::query_as::<_, TokenUsage>(query)
        .fetch_all(pool)
        .await
        .map_err(|e| anyhow!("Database error: {}", e))?;

    Ok(rows)
}

/// Fetches weekly token usage metrics from the database.
pub async fn get_token_usage_by_week(pool: &SqlitePool) -> Result<Vec<WeeklyTokenUsage>> {
    let query = r#"
        SELECT
            strftime('%Y-%W', raw_events.timestamp) AS week,
            repositories.name AS repository,
            agents.provider,
            agents.name AS agent,
            SUM(json_extract(raw_events.payload, '$.tokens')) AS total_tokens
        FROM raw_events
        LEFT JOIN repositories ON raw_events.repository_id = repositories.id
        LEFT JOIN agents ON raw_events.agent_id = agents.id
        WHERE raw_events.event_type = 'token_usage'
        GROUP BY week, repositories.name, agents.provider, agents.name
        ORDER BY week DESC
    "#;

    let rows = sqlx::query_as::<_, WeeklyTokenUsage>(query)
        .fetch_all(pool)
        .await
        .map_err(|e| anyhow!("Database error: {}", e))?;

    Ok(rows)
}

/// Fetches monthly token usage metrics from the database.
pub async fn get_token_usage_by_month(pool: &SqlitePool) -> Result<Vec<MonthlyTokenUsage>> {
    let query = r#"
        SELECT
            strftime('%Y-%m', raw_events.timestamp) AS month,
            repositories.name AS repository,
            agents.provider,
            agents.name AS agent,
            SUM(json_extract(raw_events.payload, '$.tokens')) AS total_tokens
        FROM raw_events
        LEFT JOIN repositories ON raw_events.repository_id = repositories.id
        LEFT JOIN agents ON raw_events.agent_id = agents.id
        WHERE raw_events.event_type = 'token_usage'
        GROUP BY month, repositories.name, agents.provider, agents.name
        ORDER BY month DESC
    "#;

    let rows = sqlx::query_as::<_, MonthlyTokenUsage>(query)
        .fetch_all(pool)
        .await
        .map_err(|e| anyhow!("Database error: {}", e))?;

    Ok(rows)
}

/// Fetches total savings metrics from the database.
pub async fn get_total_savings(pool: &SqlitePool) -> Result<SavingsMetrics> {
    let query = r#"
        SELECT
            SUM(json_extract(raw_events.payload, '$.rtk_savings')) AS rtk_savings,
            SUM(json_extract(raw_events.payload, '$.graphify_savings')) AS graphify_savings,
            SUM(json_extract(raw_events.payload, '$.codegraph_savings')) AS codegraph_savings,
            SUM(json_extract(raw_events.payload, '$.total_savings')) AS total_savings
        FROM raw_events
        WHERE raw_events.event_type = 'savings'
    "#;

    let row = sqlx::query_as::<_, SavingsMetrics>(query)
        .fetch_one(pool)
        .await
        .map_err(|e| anyhow!("Database error: {}", e))?;

    Ok(row)
}

/// Fetches productivity metrics from the database.
pub async fn get_productivity_metrics(pool: &SqlitePool) -> Result<ProductivityMetrics> {
    let query = r#"
        SELECT
            SUM(CASE WHEN json_extract(raw_events.payload, '$.first_pass_success') = 'true' THEN 1 ELSE 0 END) AS first_pass_success,
            SUM(CASE WHEN raw_events.event_type = 'intervention' THEN 1 ELSE 0 END) AS interventions,
            SUM(CASE WHEN json_extract(raw_events.payload, '$.retries') > 0 THEN 1 ELSE 0 END) AS retries,
            SUM(CASE WHEN json_extract(raw_events.payload, '$.task_status') = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
            SUM(CASE WHEN json_extract(raw_events.payload, '$.build_status') = 'success' THEN 1 ELSE 0 END) AS successful_builds,
            SUM(CASE WHEN json_extract(raw_events.payload, '$.test_status') = 'success' THEN 1 ELSE 0 END) AS successful_tests,
            COUNT(raw_events.id) AS total_events
        FROM raw_events
    "#;

    let row = sqlx::query!(query, pool)
        .fetch_one(pool)
        .await
        .map_err(|e| anyhow!("Database error: {}", e))?;

    let total_events = row.total_events as f64;

    let metrics = ProductivityMetrics {
        first_pass_success: (row.first_pass_success as f64 / total_events) * 100.0,
        intervention_rate: (row.interventions as f64 / total_events) * 100.0,
        retry_rate: (row.retries as f64 / total_events) * 100.0,
        task_completion_rate: (row.completed_tasks as f64 / total_events) * 100.0,
        build_success_rate: (row.successful_builds as f64 / total_events) * 100.0,
        test_success_rate: (row.successful_tests as f64 / total_events) * 100.0,
    };

    Ok(metrics)
}

/// Fetches quality metrics from the database.
pub async fn get_quality_metrics(pool: &SqlitePool) -> Result<QualityMetrics> {
    let query = r#"
        SELECT
            SUM(CASE WHEN json_extract(raw_events.payload, '$.build_status') = 'success' THEN 1 ELSE 0 END) AS successful_builds,
            SUM(CASE WHEN json_extract(raw_events.payload, '$.test_status') = 'success' THEN 1 ELSE 0 END) AS successful_tests,
            SUM(CASE WHEN json_extract(raw_events.payload, '$.lint_status') = 'success' THEN 1 ELSE 0 END) AS successful_lints,
            SUM(CASE WHEN json_extract(raw_events.payload, '$.regression') = 'true' THEN 1 ELSE 0 END) AS regressions,
            COUNT(raw_events.id) AS total_events
        FROM raw_events
    "#;

    let row = sqlx::query!(query, pool)
        .fetch_one(pool)
        .await
        .map_err(|e| anyhow!("Database error: {}", e))?;

    let total_events = row.total_events as f64;

    let metrics = QualityMetrics {
        build_success_rate: (row.successful_builds as f64 / total_events) * 100.0,
        test_success_rate: (row.successful_tests as f64 / total_events) * 100.0,
        lint_success_rate: (row.successful_lints as f64 / total_events) * 100.0,
        regression_rate: (row.regressions as f64 / total_events) * 100.0,
    };

    Ok(metrics)
}

/// Fetches retrieval metrics from the database.
pub async fn get_retrieval_metrics(pool: &SqlitePool) -> Result<RetrievalMetrics> {
    let query = r#"
        SELECT
            AVG(json_extract(raw_events.payload, '$.accuracy')) AS accuracy,
            AVG(json_extract(raw_events.payload, '$.latency')) AS latency,
            SUM(json_extract(raw_events.payload, '$.savings')) AS savings
        FROM raw_events
        WHERE raw_events.event_type = 'retrieval'
    "#;

    let row = sqlx::query_as::<_, RetrievalMetrics>(query)
        .fetch_one(pool)
        .await
        .map_err(|e| anyhow!("Database error: {}", e))?;

    Ok(row)
}