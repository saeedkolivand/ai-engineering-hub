//! Runtime smoke check (dev tool, not a test suite): bootstrap an in-memory DB,
//! ingest a few canonical events from an *unregistered* tool, then verify the
//! source auto-registered and analytics reflect the data.
//! Run: `cargo run -p aeh-core --example smoke`
use aeh_core::{analytics, db, ingestion, sources, state::AppState};
use serde_json::json;
use shared_events::{EntityRefs, EventEnvelope};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let pool = db::init_memory_pool().await?;
    sources::seed_presets(&pool).await?;
    let state = AppState::new(pool);

    let now = chrono::Utc::now();
    let mk = |source: &str, event_type: &str, payload| EventEnvelope {
        source: source.to_string(),
        event_type: event_type.to_string(),
        timestamp: now,
        refs: EntityRefs::default(),
        payload,
    };

    // Known preset + an UNKNOWN tool ("aider") to exercise auto-detection.
    ingestion::ingest(
        &state,
        mk("claude-code", "token_usage", json!({ "tokens": 1200 })),
    )
    .await?;
    ingestion::ingest(&state, mk("aider", "token_usage", json!({ "tokens": 800 }))).await?;
    ingestion::ingest(&state, mk("rtk", "savings", json!({ "savings": 500 }))).await?;
    ingestion::ingest(
        &state,
        mk(
            "graphify",
            "retrieval",
            json!({ "accuracy": 0.92, "latency": 35, "savings": 120 }),
        ),
    )
    .await?;

    let srcs = sources::list_sources(&state.pool).await?;
    let aider = srcs
        .iter()
        .find(|s| s.key == "aider")
        .expect("aider auto-registered");
    println!(
        "auto-detected source: {} (origin={:?}, enabled={})",
        aider.key, aider.origin, aider.enabled
    );

    let a = analytics::analytics(&state.pool).await?;
    println!("tokens.monthly = {}", a.tokens.monthly_usage);
    println!("tokens.source_breakdown = {:?}", a.tokens.source_breakdown);
    println!("savings.total = {}", a.savings.total_savings);
    println!("retrieval.accuracy = {}", a.retrieval.accuracy);

    assert_eq!(a.tokens.monthly_usage, 2000, "1200 + 800 tokens");
    assert_eq!(a.savings.total_savings, 500);
    assert!(a
        .tokens
        .source_breakdown
        .iter()
        .any(|b| b.label == "aider" && b.value == 800.0));
    println!("\nSMOKE OK");
    Ok(())
}
