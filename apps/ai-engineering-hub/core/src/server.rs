//! The Axum HTTP + WebSocket server. Bound to 127.0.0.1 only; consumed by both the
//! hub UI and the Stream Deck plugin. Runs inside the Tauri process (spawned in setup()).
use crate::error::{AppError, AppResult};
use crate::state::SharedState;
use crate::{analytics, ingestion, intelligence, models, sources};
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, Query, State};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;
use shared_events::EventEnvelope;
use std::net::Ipv4Addr;
use tower_http::cors::CorsLayer;

#[derive(Debug, Default, Deserialize)]
struct ListParams {
    repository_id: Option<String>,
    session_id: Option<String>,
}

pub fn router(state: SharedState) -> Router {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/api/v1/repositories", get(repositories))
        .route("/api/v1/repositories/{id}", get(repository))
        .route("/api/v1/sessions", get(sessions))
        .route("/api/v1/tasks", get(tasks))
        .route("/api/v1/agents", get(agents))
        .route("/api/v1/sources", get(list_sources))
        .route("/api/v1/sources/{id}/enabled", post(set_source_enabled))
        .route("/api/v1/analytics", get(analytics_all))
        .route("/api/v1/intelligence", get(intel))
        .route("/api/v1/ingest", post(ingest))
        .route("/ws/events", get(ws_events))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

/// Bind and serve on 127.0.0.1:`port`.
pub async fn serve(state: SharedState, port: u16) -> anyhow::Result<()> {
    let listener = tokio::net::TcpListener::bind((Ipv4Addr::LOCALHOST, port)).await?;
    tracing::info!("Hub API listening on http://127.0.0.1:{port}");
    axum::serve(listener, router(state)).await?;
    Ok(())
}

async fn repositories(State(s): State<SharedState>) -> AppResult<impl IntoResponse> {
    Ok(Json(models::list_repositories(&s.pool).await?))
}

async fn repository(State(s): State<SharedState>, Path(id): Path<String>) -> AppResult<impl IntoResponse> {
    match models::get_repository(&s.pool, &id).await? {
        Some(r) => Ok(Json(r)),
        None => Err(AppError::NotFound(format!("repository {id}"))),
    }
}

async fn sessions(State(s): State<SharedState>, Query(p): Query<ListParams>) -> AppResult<impl IntoResponse> {
    Ok(Json(models::list_sessions(&s.pool, p.repository_id.as_deref()).await?))
}

async fn tasks(State(s): State<SharedState>, Query(p): Query<ListParams>) -> AppResult<impl IntoResponse> {
    Ok(Json(models::list_tasks(&s.pool, p.session_id.as_deref()).await?))
}

async fn agents(State(s): State<SharedState>) -> AppResult<impl IntoResponse> {
    Ok(Json(models::list_agents(&s.pool).await?))
}

async fn list_sources(State(s): State<SharedState>) -> AppResult<impl IntoResponse> {
    Ok(Json(sources::list_sources(&s.pool).await?))
}

#[derive(Debug, Deserialize)]
struct EnabledBody {
    enabled: bool,
}

async fn set_source_enabled(
    State(s): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<EnabledBody>,
) -> AppResult<impl IntoResponse> {
    sources::set_enabled(&s.pool, &id, body.enabled).await?;
    Ok(Json(json!({ "ok": true })))
}

async fn analytics_all(State(s): State<SharedState>) -> AppResult<impl IntoResponse> {
    Ok(Json(analytics::analytics(&s.pool).await?))
}

async fn intel(State(s): State<SharedState>) -> AppResult<impl IntoResponse> {
    Ok(Json(intelligence::intelligence(&s.pool).await?))
}

/// Accept a single envelope or a batch.
#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum IngestBody {
    Many(Vec<EventEnvelope>),
    One(EventEnvelope),
}

async fn ingest(State(s): State<SharedState>, Json(body): Json<IngestBody>) -> AppResult<impl IntoResponse> {
    let count = match body {
        IngestBody::Many(events) => ingestion::ingest_batch(&s, events).await?,
        IngestBody::One(event) => {
            ingestion::ingest(&s, event).await?;
            1
        }
    };
    Ok(Json(json!({ "ingested": count })))
}

async fn ws_events(ws: WebSocketUpgrade, State(s): State<SharedState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, s))
}

async fn handle_ws(mut socket: WebSocket, state: SharedState) {
    let mut rx = state.tx.subscribe();
    loop {
        tokio::select! {
            incoming = socket.recv() => {
                match incoming {
                    Some(Ok(_)) => { /* subscription control messages: ignored for now */ }
                    _ => break, // client disconnected
                }
            }
            event = rx.recv() => {
                match event {
                    Ok(ev) => {
                        let payload = serde_json::to_string(&ev)
                            .unwrap_or_else(|_| "{}".to_string());
                        if socket.send(Message::Text(payload.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => { /* lagged/closed: keep serving */ }
                }
            }
        }
    }
}
