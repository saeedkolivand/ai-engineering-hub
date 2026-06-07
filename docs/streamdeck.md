# Stream Deck Integration Guide

The Stream Deck plugin lives in `apps/ai-engineering-hub/src/frontend/src/plugins/streamdeck.ts`.

## Overview

- The plugin creates a **WebSocket consumer** that connects to `ws://localhost:3000/ws/metrics`.
- It receives `HubEvent` messages (e.g., token usage, savings, health).
- Events are forwarded to the Stream Deck UI via `window.sendToPropertyInspector`.

## Building the Plugin

1. Follow the official **Elgato Stream Deck SDK** installation steps.
2. Place the compiled JavaScript bundle (from the `frontend` build) into the plugin’s
   `Contents/` folder.
3. Ensure the `manifest.json` references the entry point `streamdeck.js`.
4. Load the plugin in the Stream Deck application (Developer > Load Plugin).

## Event Types

| Event Type   | Payload Example                                 |
|--------------|-------------------------------------------------|
| `tokenUsage` | `{ "type": "tokenUsage", "value": 12345 }`      |
| `savings`    | `{ "type": "savings", "value": 6789 }`          |
| `buildStatus`| `{ "type": "buildStatus", "status": "success"}`|
| `activity`   | `{ "type": "activity", "detail": "Task started..." }`|

The UI on the Deck can map these events to button titles, icons, or progress
bars. No direct DB access is performed; all data flows through the Hub's
WebSocket.

## Testing the Plugin

- Start the backend: `cargo run`.
- Run the frontend dev server: `pnpm dev`.
- Verify the WebSocket connection by opening the browser console and checking
  for `window.sendToPropertyInspector` calls.
- In the Stream Deck software, open the **Actions** panel and add the plugin
  action to a button. The button should update as events are received.