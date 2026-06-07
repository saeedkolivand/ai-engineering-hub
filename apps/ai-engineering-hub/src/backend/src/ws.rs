use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::time::Duration;
use tokio::sync::broadcast;
use tracing::info;

/// Shared state for WebSocket broadcasting
#[derive(Clone)]
pub struct WsState {
    pub tx: broadcast::Sender<Value>,
}

impl WsState {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(128);
        Self { tx }
    }
}

/// Generate simulated per-agent token metrics
fn generate_agent_metrics() -> Value {
    json!({
        "type": "agentMetrics",
        "metrics": [
            { "agent": "Claude", "tokensUsed": 12_345, "tokensSaved": 2_345 },
            { "agent": "OpenCode", "tokensUsed": 5_678, "tokensSaved": 1_023 },
            { "agent": "Cline", "tokensUsed": 3_210, "tokensSaved": 890 },
            { "agent": "Gemini CLI", "tokensUsed": 1_500, "tokensSaved": 300 },
            { "agent": "RTK", "tokensUsed": 8_923, "tokensSaved": 1_502 },
            { "agent": "Graphify", "tokensUsed": 4_567, "tokensSaved": 801 },
            { "agent": "CodeGraph", "tokensUsed": 2_100, "tokensSaved": 450 },
        ]
    })
}

/// WebSocket upgrade handler - uses axum 0.8 state extractor
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    state: axum::extract::State<WsState>,
) -> impl IntoResponse {
    info!("WebSocket upgrade: /ws/metrics");
    ws.on_upgrade(move |socket| handle_socket(socket, state.0.clone()))
}

/// Handle an individual WebSocket connection
async fn handle_socket(socket: WebSocket, state: WsState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();
    let mut interval = tokio::time::interval(Duration::from_secs(2));

    // Send initial metrics
    let initial = generate_agent_metrics();
    let _ = state.tx.send(initial);

    loop {
        tokio::select! {
            // Broadcast received from server (future real metrics)
            Ok(msg) = rx.recv() => {
                let text = serde_json::to_string(&msg).unwrap_or_default();
                if sender.send(Message::Text(text.into())).await.is_err() {
                    break;
                }
            }
            // Periodic simulated metrics every 2 seconds
            _ = interval.tick() => {
                let metrics = generate_agent_metrics();
                let _ = state.tx.send(metrics.clone());
                let text = serde_json::to_string(&metrics).unwrap_or_default();
                if sender.send(Message::Text(text.into())).await.is_err() {
                    break;
                }
            }
            // Client disconnected
            msg = receiver.next() => {
                if msg.is_none() || msg.and_then(|m| m.ok()).is_none() {
                    break;
                }
            }
        }
    }

    info!("WebSocket connection closed");
}