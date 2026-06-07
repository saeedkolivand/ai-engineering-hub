use axum::{
    routing::get,
    Router,
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use serde_json::json;
use uuid::Uuid;
use shared_types::AnalyticsMetrics; // Assuming shared_types will have this
use shared_events::ActivityEvent; // Assuming shared_events will have this

/// Build the API router (stateless, compatible with any state type)
pub fn router<S: Clone + Send + Sync + 'static>() -> Router<S> {
    Router::new()
        // Health
        .route("/api/health", get(health_handler))
        // Repository routes (placeholder)
        .route("/api/repositories", get(list_repositories))
        // Session routes (placeholder)
        .route("/api/sessions", get(list_sessions))
        // Task routes (placeholder)
        .route("/api/tasks", get(list_tasks))
        // Agent routes (placeholder)
        .route("/api/agents", get(list_agents))
        // Analytics routes
        .route("/api/analytics", get(get_analytics))
        // Settings routes (placeholder)
        .route("/api/settings", get(get_settings).post(save_settings))
        // Activity routes (placeholder)
        .route("/api/activity", get(list_activity))
}

/// Health check
async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({"status": "ok"})))
}

/// List all repositories (placeholder)
async fn list_repositories() -> impl IntoResponse {
    let repos: Vec<serde_json::Value> = vec![];
    (StatusCode::OK, Json(json!({"repositories": repos})))
}

/// List all sessions (placeholder)
async fn list_sessions() -> impl IntoResponse {
    let sessions: Vec<serde_json::Value> = vec![];
    (StatusCode::OK, Json(json!({"sessions": sessions})))
}

/// List all tasks (placeholder)
async fn list_tasks() -> impl IntoResponse {
    let tasks: Vec<serde_json::Value> = vec![];
    (StatusCode::OK, Json(json!({"tasks": tasks})))
}

/// List all agents (placeholder)
async fn list_agents() -> impl IntoResponse {
    let agents: Vec<serde_json::Value> = vec![
        json!({"id": Uuid::new_v4(), "name": "Claude"}),
        json!({"id": Uuid::new_v4(), "name": "OpenCode"}),
        json!({"id": Uuid::new_v4(), "name": "Cline"}),
        json!({"id": Uuid::new_v4(), "name": "Gemini CLI"}),
        json!({"id": Uuid::new_v4(), "name": "RTK"}),
        json!({"id": Uuid::new_v4(), "name": "Graphify"}),
        json!({"id": Uuid::new_v4(), "name": "CodeGraph"}),
    ];
    (StatusCode::OK, Json(json!({"agents": agents})))
}

/// Get analytics data
async fn get_analytics() -> impl IntoResponse {
    // Placeholder data - replace with actual calculations
    let analytics = AnalyticsMetrics {
        tokens: shared_types::TokenMetrics {
            daily_usage: 10000,
            weekly_usage: 70000,
            monthly_usage: 300000,
            repository_breakdown: vec![
                ("repo1".to_string(), 5000),
                ("repo2".to_string(), 3000),
            ],
            provider_breakdown: vec![
                ("claude".to_string(), 7000),
                ("gemini".to_string(), 3000),
            ],
            agent_breakdown: vec![
                ("claude-agent".to_string(), 6000),
                ("gemini-agent".to_string(), 4000),
            ],
        },
        savings: shared_types::SavingsMetrics {
            rtk_savings: 500,
            graphify_savings: 300,
            codegraph_savings: 200,
            total_savings: 1000,
        },
        productivity: shared_types::ProductivityMetrics {
            first_pass_success: 0.85,
            intervention_rate: 0.10,
            retry_rate: 0.05,
            task_completion_rate: 0.95,
            build_success: 0.98,
            test_success: 0.95,
        },
        quality: shared_types::QualityMetrics {
            build_success: 0.98,
            test_success: 0.95,
            lint_success: 0.99,
            regressions: 0.01,
        },
        retrieval: shared_types::RetrievalMetrics {
            accuracy: 0.92,
            latency: 150.5,
            savings: 400,
        },
    };
    (StatusCode::OK, Json(analytics))
}

/// Get user settings (placeholder)
async fn get_settings() -> impl IntoResponse {
    // Placeholder settings
    let settings = json!({
        "theme": "light",
        "apiEndpoint": "http://localhost:3000",
        "enableTelemetry": false
    });
    (StatusCode::OK, Json(settings))
}

/// Save user settings (placeholder)
async fn save_settings(Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    // In a real app, you'd parse and save these settings.
    // For now, we just acknowledge the payload.
    tracing::info!("Received settings: {:?}", payload);
    (StatusCode::OK, Json(json!({"success": true})))
}

/// List activity events (placeholder)
async fn list_activity() -> impl IntoResponse {
    let events: Vec<ActivityEvent> = vec![
        ActivityEvent {
            id: Uuid::new_v4(),
            repository: "my-awesome-repo".to_string(),
            task: "Refactor code".to_string(),
            agent: "Claude".to_string(),
            event_type: "intervention".to_string(),
            timestamp: chrono::Utc::now(),
            token_impact: -50,
        },
        ActivityEvent {
            id: Uuid::new_v4(),
            repository: "another-repo".to_string(),
            task: "Write tests".to_string(),
            agent: "RTK".to_string(),
            event_type: "metric".to_string(),
            timestamp: chrono::Utc::now() - chrono::Duration::minutes(5),
            token_impact: 10,
        },
    ];
    (StatusCode::OK, Json(events))
}