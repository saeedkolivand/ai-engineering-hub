//! Dimensional analytics. Every breakdown groups by one of source/provider/agent/
//! repository over the dynamic `sources` set — the named tools are just rows.
use crate::error::AppResult;
use shared_types::{
    AnalyticsMetrics, Breakdown, ProductivityMetrics, QualityMetrics, RetrievalMetrics,
    SavingsMetrics, TokenMetrics,
};
use sqlx::SqlitePool;

#[derive(Debug, sqlx::FromRow)]
struct LabelValue {
    label: Option<String>,
    value: Option<f64>,
}

#[derive(Debug, sqlx::FromRow)]
struct Scalar {
    value: Option<f64>,
}

async fn scalar(pool: &SqlitePool, sql: &str) -> AppResult<f64> {
    let row = sqlx::query_as::<_, Scalar>(sql).fetch_optional(pool).await?;
    Ok(row.and_then(|r| r.value).unwrap_or(0.0))
}

pub(crate) async fn breakdown(pool: &SqlitePool, sql: &str) -> AppResult<Vec<Breakdown>> {
    let rows = sqlx::query_as::<_, LabelValue>(sql).fetch_all(pool).await?;
    Ok(rows
        .into_iter()
        .map(|r| Breakdown {
            label: r.label.unwrap_or_else(|| "unknown".into()),
            value: r.value.unwrap_or(0.0),
        })
        .collect())
}

pub async fn token_metrics(pool: &SqlitePool) -> AppResult<TokenMetrics> {
    let tok = "json_extract(raw_events.payload, '$.tokens')";
    let base = "FROM raw_events WHERE event_type = 'token_usage'";

    let daily = scalar(pool, &format!(
        "SELECT CAST(SUM({tok}) AS REAL) AS value {base} AND DATE(timestamp) = DATE('now')"
    )).await? as u64;
    let weekly = scalar(pool, &format!(
        "SELECT CAST(SUM({tok}) AS REAL) AS value {base} AND strftime('%Y-%W', timestamp) = strftime('%Y-%W','now')"
    )).await? as u64;
    let monthly = scalar(pool, &format!(
        "SELECT CAST(SUM({tok}) AS REAL) AS value {base} AND strftime('%Y-%m', timestamp) = strftime('%Y-%m','now')"
    )).await? as u64;

    let repository_breakdown = breakdown(pool, &format!(
        "SELECT COALESCE(repositories.name, raw_events.repository_id, 'unattributed') AS label, CAST(SUM({tok}) AS REAL) AS value \
         FROM raw_events LEFT JOIN repositories ON raw_events.repository_id = repositories.id \
         WHERE event_type = 'token_usage' GROUP BY label ORDER BY value DESC"
    )).await?;
    let provider_breakdown = breakdown(pool, &format!(
        "SELECT COALESCE(agents.provider, 'unknown') AS label, CAST(SUM({tok}) AS REAL) AS value \
         FROM raw_events LEFT JOIN agents ON raw_events.agent_id = agents.id \
         WHERE event_type = 'token_usage' GROUP BY label ORDER BY value DESC"
    )).await?;
    let agent_breakdown = breakdown(pool, &format!(
        "SELECT COALESCE(agents.name, raw_events.agent_id, 'unknown') AS label, CAST(SUM({tok}) AS REAL) AS value \
         FROM raw_events LEFT JOIN agents ON raw_events.agent_id = agents.id \
         WHERE event_type = 'token_usage' GROUP BY label ORDER BY value DESC"
    )).await?;
    let source_breakdown = breakdown(pool, &format!(
        "SELECT source AS label, CAST(SUM({tok}) AS REAL) AS value FROM raw_events \
         WHERE event_type = 'token_usage' GROUP BY source ORDER BY value DESC"
    )).await?;

    Ok(TokenMetrics {
        daily_usage: daily,
        weekly_usage: weekly,
        monthly_usage: monthly,
        repository_breakdown,
        provider_breakdown,
        agent_breakdown,
        source_breakdown,
    })
}

pub async fn savings_metrics(pool: &SqlitePool) -> AppResult<SavingsMetrics> {
    let sav = "json_extract(raw_events.payload, '$.savings')";
    let by_source = breakdown(pool, &format!(
        "SELECT source AS label, CAST(SUM({sav}) AS REAL) AS value FROM raw_events \
         WHERE event_type = 'savings' GROUP BY source ORDER BY value DESC"
    )).await?;
    let total = scalar(pool, &format!(
        "SELECT CAST(SUM({sav}) AS REAL) AS value FROM raw_events WHERE event_type = 'savings'"
    )).await? as u64;
    Ok(SavingsMetrics { by_source, total_savings: total })
}

pub async fn productivity_metrics(pool: &SqlitePool) -> AppResult<ProductivityMetrics> {
    let rate = |field: &str, value: &str| {
        format!(
            "SELECT CAST(SUM(CASE WHEN json_extract(payload, '{field}') = {value} THEN 1 ELSE 0 END) AS REAL) \
             * 100.0 / NULLIF(COUNT(*), 0) AS value FROM raw_events"
        )
    };
    Ok(ProductivityMetrics {
        first_pass_success: scalar(pool, &rate("$.first_pass_success", "'true'")).await?,
        intervention_rate: scalar(pool,
            "SELECT CAST(SUM(CASE WHEN event_type = 'intervention' THEN 1 ELSE 0 END) AS REAL) \
             * 100.0 / NULLIF(COUNT(*), 0) AS value FROM raw_events").await?,
        retry_rate: scalar(pool,
            "SELECT CAST(SUM(CASE WHEN json_extract(payload, '$.retries') > 0 THEN 1 ELSE 0 END) AS REAL) \
             * 100.0 / NULLIF(COUNT(*), 0) AS value FROM raw_events").await?,
        task_completion_rate: scalar(pool, &rate("$.task_status", "'completed'")).await?,
        build_success: scalar(pool, &rate("$.build_status", "'success'")).await?,
        test_success: scalar(pool, &rate("$.test_status", "'success'")).await?,
    })
}

pub async fn quality_metrics(pool: &SqlitePool) -> AppResult<QualityMetrics> {
    let rate = |field: &str, value: &str| {
        format!(
            "SELECT CAST(SUM(CASE WHEN json_extract(payload, '{field}') = {value} THEN 1 ELSE 0 END) AS REAL) \
             * 100.0 / NULLIF(COUNT(*), 0) AS value FROM raw_events"
        )
    };
    Ok(QualityMetrics {
        build_success: scalar(pool, &rate("$.build_status", "'success'")).await?,
        test_success: scalar(pool, &rate("$.test_status", "'success'")).await?,
        lint_success: scalar(pool, &rate("$.lint_status", "'success'")).await?,
        regressions: scalar(pool, &rate("$.regression", "'true'")).await?,
    })
}

pub async fn retrieval_metrics(pool: &SqlitePool) -> AppResult<RetrievalMetrics> {
    let base = "FROM raw_events WHERE event_type = 'retrieval'";
    Ok(RetrievalMetrics {
        accuracy: scalar(pool, &format!("SELECT AVG(json_extract(payload, '$.accuracy')) AS value {base}")).await?,
        latency: scalar(pool, &format!("SELECT AVG(json_extract(payload, '$.latency')) AS value {base}")).await?,
        savings: scalar(pool, &format!("SELECT CAST(SUM(json_extract(payload, '$.savings')) AS REAL) AS value {base}")).await? as u64,
    })
}

pub async fn analytics(pool: &SqlitePool) -> AppResult<AnalyticsMetrics> {
    Ok(AnalyticsMetrics {
        tokens: token_metrics(pool).await?,
        savings: savings_metrics(pool).await?,
        productivity: productivity_metrics(pool).await?,
        quality: quality_metrics(pool).await?,
        retrieval: retrieval_metrics(pool).await?,
    })
}
