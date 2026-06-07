use sqlx::SqlitePool;
use crate::repository;

/// Aggregated token analytics from the database
pub struct TokenAnalytics {
    pub daily: i64,
    pub weekly: i64,
    pub monthly: i64,
}

pub struct Savings {
    pub total: i64,
}

/// Retrieve aggregated token usage for day, week, month
pub async fn get_token_analytics(pool: &SqlitePool) -> TokenAnalytics {
    TokenAnalytics {
        daily: repository::get_token_usage_by_day(pool).await.unwrap_or(0),
        weekly: repository::get_token_usage_by_week(pool).await.unwrap_or(0),
        monthly: repository::get_token_usage_by_month(pool).await.unwrap_or(0),
    }
}

/// Retrieve total token savings
pub async fn get_total_savings(pool: &SqlitePool) -> Savings {
    Savings {
        total: repository::get_total_savings(pool).await.unwrap_or(0),
    }
}