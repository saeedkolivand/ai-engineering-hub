//! Repository intelligence: hotspots and bottlenecks aggregated across the event stream.
use crate::analytics::breakdown;
use crate::error::AppResult;
use serde::Serialize;
use shared_types::Breakdown;
use sqlx::SqlitePool;

#[derive(Debug, Serialize)]
pub struct Intelligence {
    pub intervention_hotspots: Vec<Breakdown>,
    pub retry_hotspots: Vec<Breakdown>,
    pub expensive_agents: Vec<Breakdown>,
    pub retrieval_bottlenecks: Vec<Breakdown>,
}

pub async fn intelligence(pool: &SqlitePool) -> AppResult<Intelligence> {
    let repo_label = "COALESCE(repositories.name, raw_events.repository_id, 'unattributed')";

    let intervention_hotspots = breakdown(pool, &format!(
        "SELECT {repo_label} AS label, CAST(COUNT(*) AS REAL) AS value \
         FROM raw_events LEFT JOIN repositories ON raw_events.repository_id = repositories.id \
         WHERE event_type = 'intervention' GROUP BY label ORDER BY value DESC LIMIT 20"
    )).await?;

    let retry_hotspots = breakdown(pool, &format!(
        "SELECT {repo_label} AS label, CAST(SUM(json_extract(payload, '$.retries')) AS REAL) AS value \
         FROM raw_events LEFT JOIN repositories ON raw_events.repository_id = repositories.id \
         GROUP BY label HAVING value > 0 ORDER BY value DESC LIMIT 20"
    )).await?;

    let expensive_agents = breakdown(pool,
        "SELECT COALESCE(agents.name, raw_events.agent_id, 'unknown') AS label, \
         CAST(SUM(json_extract(raw_events.payload, '$.tokens')) AS REAL) AS value \
         FROM raw_events LEFT JOIN agents ON raw_events.agent_id = agents.id \
         WHERE event_type = 'token_usage' GROUP BY label ORDER BY value DESC LIMIT 20").await?;

    let retrieval_bottlenecks = breakdown(pool,
        "SELECT source AS label, AVG(json_extract(payload, '$.latency')) AS value \
         FROM raw_events WHERE event_type = 'retrieval' GROUP BY source ORDER BY value DESC LIMIT 20").await?;

    Ok(Intelligence {
        intervention_hotspots,
        retry_hotspots,
        expensive_agents,
        retrieval_bottlenecks,
    })
}
