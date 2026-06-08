// Shared domain + analytics types. Mirrors packages/shared-types/src/lib.rs (TS↔Rust parity).

// ---------------------------------------------------------------------------
// Dynamic source registry
// ---------------------------------------------------------------------------

export type SourceKind = "cli" | "mcp" | "library" | "service" | "custom";
export type SourceOrigin = "builtin_preset" | "auto_detected" | "user_defined";

export interface SourceCapabilities {
  emits_tokens?: boolean;
  emits_savings?: boolean;
  emits_build?: boolean;
  emits_test?: boolean;
  emits_lint?: boolean;
  emits_retrieval?: boolean;
}

/** A field-mapping rule for the ConfigurableAdapter (no recompile to add a tool). */
export interface MappingRule {
  /** Canonical target field, e.g. "tokens", "event_type", "repository_id". */
  target: string;
  /** "jsonpath" | "pointer" | "regex" | "const". */
  kind: string;
  /** The expression / constant. */
  expr: string;
}

export interface Source {
  id: string;
  key: string;
  display_name: string;
  kind: SourceKind;
  origin: SourceOrigin;
  capabilities: SourceCapabilities;
  mapping_rules?: MappingRule[];
  enabled: boolean;
  last_seen_at?: string;
  event_count: number;
}

/** Independent dimensions every analytics query can group by. */
export type GroupBy = "source" | "provider" | "agent" | "repository";

export interface Breakdown {
  label: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Entities (drill-down hierarchy)
// ---------------------------------------------------------------------------

export interface Repository {
  id: string;
  name: string;
  path: string;
  metadata?: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  repository_id: string;
  start_time: string;
  end_time?: string | null;
  status: string;
}

export interface Task {
  id: string;
  session_id: string;
  description?: string | null;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface Agent {
  id: string;
  name: string;
  provider: string;
  model_id?: string | null;
}

// ---------------------------------------------------------------------------
// Analytics categories
// ---------------------------------------------------------------------------

export interface TokenMetrics {
  daily_usage: number;
  weekly_usage: number;
  monthly_usage: number;
  repository_breakdown: Breakdown[];
  provider_breakdown: Breakdown[];
  agent_breakdown: Breakdown[];
  source_breakdown: Breakdown[];
}

export interface SavingsMetrics {
  by_source: Breakdown[];
  total_savings: number;
}

export interface ProductivityMetrics {
  first_pass_success: number;
  intervention_rate: number;
  retry_rate: number;
  task_completion_rate: number;
  build_success: number;
  test_success: number;
}

export interface QualityMetrics {
  build_success: number;
  test_success: number;
  lint_success: number;
  regressions: number;
}

export interface RetrievalMetrics {
  accuracy: number;
  latency: number;
  savings: number;
}

export interface AnalyticsMetrics {
  tokens: TokenMetrics;
  savings: SavingsMetrics;
  productivity: ProductivityMetrics;
  quality: QualityMetrics;
  retrieval: RetrievalMetrics;
}

/** Repository intelligence (hotspots/bottlenecks). Mirrors core/src/intelligence.rs. */
export interface Intelligence {
  intervention_hotspots: Breakdown[];
  retry_hotspots: Breakdown[];
  expensive_agents: Breakdown[];
  retrieval_bottlenecks: Breakdown[];
}

/** Lightweight metric shape for Stream Deck monitors. */
export interface Metric {
  id: string;
  type: string;
  value: number | string;
  unit?: string;
  timestamp?: number;
  name?: string;
  status?: string;
  category?: string;
}
