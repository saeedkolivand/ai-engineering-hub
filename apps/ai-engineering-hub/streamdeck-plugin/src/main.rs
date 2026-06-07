use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct Metric {
    pub id: String,
    pub task_id: Option<String>,
    pub metric_type: String,
    pub value: f64,
    pub unit: Option<String>,
    pub recorded_at: String,
}

#[tauri::command]
async fn get_latest_metrics() -> Result<Vec<Metric>, String> {
    // Placeholder: In a real implementation, this would call the hub's API over WebSocket or HTTP.
    Ok(vec![])
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_latest_metrics])
        .run(tauri::generate_context!())
        .expect("failed to run streamdeck plugin");
}