//! Shared domain + analytics types. Mirrors `packages/shared-types/src/index.ts` (TS↔Rust parity).
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Dynamic source registry contracts
// ---------------------------------------------------------------------------

/// How a tool integrates with the host environment.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SourceKind {
    Cli,
    Mcp,
    Library,
    Service,
    Custom,
}

/// How a source row came to exist.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SourceOrigin {
    BuiltinPreset,
    AutoDetected,
    UserDefined,
}

/// What kinds of metrics a source emits (capability-driven, so savings/build/etc.
/// are never hardcoded per-tool).
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct SourceCapabilities {
    #[serde(default)]
    pub emits_tokens: bool,
    #[serde(default)]
    pub emits_savings: bool,
    #[serde(default)]
    pub emits_build: bool,
    #[serde(default)]
    pub emits_test: bool,
    #[serde(default)]
    pub emits_lint: bool,
    #[serde(default)]
    pub emits_retrieval: bool,
}

/// A field-mapping rule for the ConfigurableAdapter: extract a canonical field
/// from a raw record via a JSONPath or regex expression. No recompile needed to
/// add a new tool — just rows of these.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MappingRule {
    /// Canonical target field, e.g. "tokens", "event_type", "repository".
    pub target: String,
    /// Extractor kind: "jsonpath" | "regex" | "const".
    pub kind: String,
    /// The expression / constant value.
    pub expr: String,
}

/// A registered tool/source.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Source {
    pub id: String,
    pub key: String,
    pub display_name: String,
    pub kind: SourceKind,
    pub origin: SourceOrigin,
    pub capabilities: SourceCapabilities,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mapping_rules: Option<Vec<MappingRule>>,
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_seen_at: Option<String>,
    #[serde(default)]
    pub event_count: u64,
}

/// The independent dimensions every analytics query can group by.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GroupBy {
    Source,
    Provider,
    Agent,
    Repository,
}

/// A single (label, value) row in a dimensional breakdown.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Breakdown {
    pub label: String,
    pub value: f64,
}

// ---------------------------------------------------------------------------
// Analytics categories
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TokenMetrics {
    pub daily_usage: u64,
    pub weekly_usage: u64,
    pub monthly_usage: u64,
    pub repository_breakdown: Vec<Breakdown>,
    pub provider_breakdown: Vec<Breakdown>,
    pub agent_breakdown: Vec<Breakdown>,
    pub source_breakdown: Vec<Breakdown>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SavingsMetrics {
    /// Savings per savings-capable source (dynamic — not hardcoded RTK/Graphify/CodeGraph).
    pub by_source: Vec<Breakdown>,
    pub total_savings: u64,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct ProductivityMetrics {
    pub first_pass_success: f64,
    pub intervention_rate: f64,
    pub retry_rate: f64,
    pub task_completion_rate: f64,
    pub build_success: f64,
    pub test_success: f64,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct QualityMetrics {
    pub build_success: f64,
    pub test_success: f64,
    pub lint_success: f64,
    pub regressions: f64,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct RetrievalMetrics {
    pub accuracy: f64,
    pub latency: f64, // ms
    pub savings: u64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AnalyticsMetrics {
    pub tokens: TokenMetrics,
    pub savings: SavingsMetrics,
    pub productivity: ProductivityMetrics,
    pub quality: QualityMetrics,
    pub retrieval: RetrievalMetrics,
}
