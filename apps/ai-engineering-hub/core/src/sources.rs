//! Dynamic source/tool registry. Sources are data, not code: unknown tools are
//! auto-registered (disabled) on first sight, and configured via mapping_rules.
use crate::error::AppResult;
use shared_types::{MappingRule, Source, SourceCapabilities, SourceKind, SourceOrigin};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
struct SourceRow {
    id: String,
    key: String,
    display_name: String,
    kind: String,
    origin: String,
    capabilities: String,
    mapping_rules: Option<String>,
    enabled: i64,
    last_seen_at: Option<String>,
    event_count: i64,
}

fn parse_kind(s: &str) -> SourceKind {
    match s {
        "mcp" => SourceKind::Mcp,
        "library" => SourceKind::Library,
        "service" => SourceKind::Service,
        "custom" => SourceKind::Custom,
        _ => SourceKind::Cli,
    }
}

fn parse_origin(s: &str) -> SourceOrigin {
    match s {
        "builtin_preset" => SourceOrigin::BuiltinPreset,
        "auto_detected" => SourceOrigin::AutoDetected,
        _ => SourceOrigin::UserDefined,
    }
}

impl From<SourceRow> for Source {
    fn from(r: SourceRow) -> Self {
        let capabilities: SourceCapabilities =
            serde_json::from_str(&r.capabilities).unwrap_or_default();
        let mapping_rules: Option<Vec<MappingRule>> = r
            .mapping_rules
            .as_deref()
            .and_then(|s| serde_json::from_str(s).ok());
        Source {
            id: r.id,
            key: r.key,
            display_name: r.display_name,
            kind: parse_kind(&r.kind),
            origin: parse_origin(&r.origin),
            capabilities,
            mapping_rules,
            enabled: r.enabled != 0,
            last_seen_at: r.last_seen_at,
            event_count: r.event_count.max(0) as u64,
        }
    }
}

const SELECT: &str = "SELECT id, key, display_name, kind, origin, capabilities, mapping_rules, enabled, last_seen_at, event_count FROM sources";

pub async fn list_sources(pool: &SqlitePool) -> AppResult<Vec<Source>> {
    let rows = sqlx::query_as::<_, SourceRow>(&format!("{SELECT} ORDER BY display_name"))
        .fetch_all(pool)
        .await?;
    Ok(rows.into_iter().map(Source::from).collect())
}

async fn find_by_key(pool: &SqlitePool, key: &str) -> AppResult<Option<SourceRow>> {
    Ok(sqlx::query_as::<_, SourceRow>(&format!("{SELECT} WHERE key = ?"))
        .bind(key)
        .fetch_optional(pool)
        .await?)
}

/// Ensure a source row exists for `key`. Unknown keys are inserted as
/// `auto_detected` + disabled (surfaced in the Integrations inbox). Either way
/// `last_seen_at` and `event_count` are bumped. Returns the source id.
pub async fn ensure_source(pool: &SqlitePool, key: &str) -> AppResult<String> {
    if let Some(row) = find_by_key(pool, key).await? {
        sqlx::query(
            "UPDATE sources SET last_seen_at = CURRENT_TIMESTAMP, event_count = event_count + 1 WHERE id = ?",
        )
        .bind(&row.id)
        .execute(pool)
        .await?;
        return Ok(row.id);
    }

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO sources (id, key, display_name, kind, origin, capabilities, enabled, last_seen_at, event_count) \
         VALUES (?, ?, ?, 'custom', 'auto_detected', '{}', 0, CURRENT_TIMESTAMP, 1)",
    )
    .bind(&id)
    .bind(key)
    .bind(key) // display_name defaults to the key until the user renames it
    .execute(pool)
    .await?;
    Ok(id)
}

/// Enable/disable a source.
pub async fn set_enabled(pool: &SqlitePool, id: &str, enabled: bool) -> AppResult<()> {
    sqlx::query("UPDATE sources SET enabled = ? WHERE id = ?")
        .bind(enabled as i64)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

/// Seed the well-known tools as disabled builtin presets (idempotent).
pub async fn seed_presets(pool: &SqlitePool) -> AppResult<()> {
    const PRESETS: &[(&str, &str, &str)] = &[
        ("claude-code", "Claude Code", r#"{"emits_tokens":true,"emits_savings":false}"#),
        ("opencode", "OpenCode", r#"{"emits_tokens":true}"#),
        ("cline", "Cline", r#"{"emits_tokens":true}"#),
        ("gemini-cli", "Gemini CLI", r#"{"emits_tokens":true}"#),
        ("rtk", "RTK", r#"{"emits_savings":true}"#),
        ("graphify", "Graphify", r#"{"emits_savings":true,"emits_retrieval":true}"#),
        ("codegraph", "CodeGraph", r#"{"emits_savings":true,"emits_retrieval":true}"#),
    ];
    for (key, name, caps) in PRESETS {
        sqlx::query(
            "INSERT OR IGNORE INTO sources (id, key, display_name, kind, origin, capabilities, enabled) \
             VALUES (?, ?, ?, 'cli', 'builtin_preset', ?, 0)",
        )
        .bind(Uuid::new_v4().to_string())
        .bind(key)
        .bind(name)
        .bind(caps)
        .execute(pool)
        .await?;
    }
    Ok(())
}
