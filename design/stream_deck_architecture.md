# Stream Deck Architecture: AI Engineering Hub

## 1. Overview
The AI Engineering Monitor Stream Deck Plugin is a companion application that provides real-time, at-a-glance monitoring of the AI Engineering Hub. It consumes data from the Hub via a dedicated API and WebSocket stream, using the shared SDK and contracts.

## 2. Plugin Structure

```
apps/ai-engineering-hub/streamdeck-plugin/
├── src/
│   ├── main.rs               # Tauri main entry point
│   ├── plugins/
│   │   ├── token_monitor.rs   # Token usage monitor component
│   │   ├── savings_monitor.rs # Savings monitor component
│   │   ├── agent_monitor.rs   # Agent status monitor component
│   │   ├── task_monitor.rs    # Running tasks monitor component
│   │   ├── intervention_monitor.rs # Recent interventions monitor component
│   │   ├── productivity_monitor.rs # Productivity metrics monitor component
│   │   └── build_health_monitor.rs # Build/test status monitor component
│   │       └── retrieval_monitor.rs # Retrieval performance monitor component
│   ├── state/
│   │   ├── plugin_state.rs    # Shared plugin state
│   │   └── event_handlers.rs   # WebSocket event handlers
│   ├── api/
│   │   ├── client.rs          # API client for the Hub
│   │   └── endpoints.rs       # API endpoint definitions
│   └── utils/
│       ├── websocket.rs       # WebSocket connection logic
│       └── types.rs           # Shared types from the Hub
│
└── Cargo.toml
```

## 3. Core Components

### 3.1 Tauri Application
- **Main Process**: Manages the plugin lifecycle and connects to the Stream Deck SDK.
- **Web View**: Renders the UI components (monitors) using HTML/JS/TS.
- **Event Loop**: Handles WebSocket subscriptions and API polling.

### 3.2 Plugin SDK Integration
The plugin uses the `shared-sdk` package to:
- **Connect to the Hub**: Establishes a WebSocket connection to the Hub's real-time stream.
- **Fetch Metrics**: Uses the `shared-api-contracts` to call the Hub's API for initial state and periodic updates.
- **Handle Events**: Subscribes to specific event types from the Hub's WebSocket stream.

### 3.3 Monitor Components
Each monitor is a self-contained component that displays a specific metric.

- **Token Monitor**: Shows current token consumption and a trend line.
- **Savings Monitor**: Displays the total savings achieved.
- **Agent Monitor**: Shows the number of active agents and their status (running, idle).
- **Task Monitor**: Shows the number of running tasks and their status.
- **Intervention Monitor**: Highlights recent human interventions.
- **Productivity Monitor**: Shows the overall success rate.
- **Build Health Monitor**: Indicates the current build/test status.
- **Retrieval Monitor**: Shows retrieval accuracy and latency.

### 3.4 State Management
- **Plugin State**: Manages the current values of all displayed metrics.
- **Event Handlers**: Processes incoming events from the Hub's WebSocket and updates the state accordingly.

### 3.5 Data Fetching Strategy
- **Initial Load**: Fetches all metrics from the Hub's API once on startup.
- **Real-time Updates**: Subscribes to a high-level stream of aggregated metrics from the Hub's WebSocket.
- **Polling**: Periodically checks the API for any changes that might not be in the WebSocket stream.

## 4. Communication Protocol

### 4.1 WebSocket Protocol
- **Connection**: `ws://localhost:PORT/ws/events`
- **Subscription**: Clients send JSON objects with a `subscribe` action and topic filters.
- **Message Format**: `EventEnvelope<T>` as defined in `design/event_contracts.md`.
- **Example Subscription**:
  ```json
  {
    "action": "subscribe",
    "topic": "summary",
    "filters": {
      "type": "token_usage"
    }
  }
  ```

### 4.2 API Protocol
- **Base URL**: `http://localhost:PORT/api/v1/`
- **Endpoints**: Uses the same endpoints as the Hub's API (e.g., `/api/analytics/tokens`).
- **Authentication**: No authentication required as the plugin connects to the same local instance.

## 5. Performance Considerations

- **Low Latency**: The WebSocket connection provides near-instant updates.
- **Minimal Data**: Monitors only receive high-level summary data, not raw events.
- **Resource Efficient**: The plugin is lightweight and runs as a background process.

## 6. Deployment

- The plugin is packaged as a standard Tauri application and distributed as a `.exe` (Windows) or `.app` (macOS) file.
- It can be installed and managed through the Stream Deck application.

## 7. Future Integration

The plugin's architecture is designed to be extensible, allowing for the addition of new monitors or integration with other systems as the platform evolves.

## 8. Shared Dependencies

- **Types**: All types are imported from `shared-types`.
- **Contracts**: API and event contracts are defined in `shared-api-contracts` and `shared-events`.
- **Design Tokens**: UI styling is based on `shared-design-tokens`.