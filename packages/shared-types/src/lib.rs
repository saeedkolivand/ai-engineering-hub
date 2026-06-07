use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TokenMetrics {
    pub daily_usage: u64,
    pub weekly_usage: u64,
    pub monthly_usage: u64,
    pub repository_breakdown: Vec<(String, u64)>,
    pub provider_breakdown: Vec<(String, u64)>,
    pub agent_breakdown: Vec<(String, u64)>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SavingsMetrics {
    pub rtk_savings: u64,
    pub graphify_savings: u64,
    pub codegraph_savings: u64,
    pub total_savings: u64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ProductivityMetrics {
    pub first_pass_success: f64,
    pub intervention_rate: f64,
    pub retry_rate: f64,
    pub task_completion_rate: f64,
    pub build_success: f64,
    pub test_success: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct QualityMetrics {
    pub build_success: f64,
    pub test_success: f64,
    pub lint_success: f64,
    pub regressions: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RetrievalMetrics {
    pub accuracy: f64,
    pub latency: f64, // in milliseconds
    pub savings: u64, // cost savings from optimized retrieval
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AnalyticsMetrics {
    pub tokens: TokenMetrics,
    pub savings: SavingsMetrics,
    pub productivity: ProductivityMetrics,
    pub quality: QualityMetrics,
    pub retrieval: RetrievalMetrics,
}