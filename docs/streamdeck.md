# Stream Deck Integration Guide

The Stream Deck plugin lives in `apps/ai-engineering-hub/src/frontend/src/plugins/streamdeck.ts`.

## Overview

- The plugin creates a **WebSocket consumer** that connects to `ws://localhost:3000/ws/metrics`.
- It receives `HubEvent` messages and forwards them to the Stream Deck UI via `window.sendToPropertyInspector`.
- New **agentMetrics** event type provides token usage and savings per CLI agent.

## Agent Metrics Event

| Property   | Type   | Description                                    |
|------------|--------|------------------------------------------------|
| `type`     | string | Always `"agentMetrics"`                        |
| `metrics`  | array  | List of objects containing per‑agent data      |

### Metric Object

| Field       | Type   | Description                                 |
|-------------|--------|---------------------------------------------|
| `agent`     | string | CLI tool name (e.g., `Claude`, `RTK`)       |
| `tokensUsed`| number | Tokens consumed by this agent               |
| `tokensSaved`| number| Tokens saved by this agent (e.g., via optimizations) |

#### Example Payload Sent to Stream Deck

```json
{
  "type": "agentMetrics",
  "metrics": [
    { "agent": "Claude", "tokensUsed": 12345, "tokensSaved": 2345 },
    { "agent": "RTK", "tokensUsed": 5678, "tokensSaved": 1023 },
    { "agent": "Graphify", "tokensUsed": 890, "tokensSaved": 150 }
  ]
}
```

## Building the Plugin

1. Follow the official **Elgato Stream Deck SDK** installation steps.
2. Compile the frontend (`pnpm -C apps/ai-engineering-hub/src/frontend build`).
3. Place the generated JavaScript bundle (e.g., `streamdeck.js`) into the plugin’s `Contents/` folder.
4. Ensure `manifest.json` references the entry point `streamdeck.js`.
5. Load the plugin in the Stream Deck application (Developer > Load Plugin).

## Using the Metrics in the Stream Deck UI

- The UI receives the `agentMetrics` object via the SDK.
- Map each `agent` to a button or display element.
- Show `tokensUsed` and `tokensSaved` values, optionally with progress bars or icons.

## Testing the Plugin

- Start the backend: `cargo run`.
- Run the frontend dev server: `pnpm -C apps/ai-engineering-hub/src/frontend dev`.
- Verify the WebSocket connection by opening the browser console and ensuring `window.sendToPropertyInspector` receives `agentMetrics` messages.
- In the Stream Deck software, add the plugin action to a button and confirm the displayed values update in real time.

## Notes

- No direct DB access is performed; all data flows through the Hub's WebSocket.
- Extend the `normalizeAgentMetrics` function in `streamdeck.ts` if the backend payload structure changes.