import { HubClient } from "shared-sdk";

// The plugin ONLY consumes the Hub's API/WS (Node 20+ provides global fetch + WebSocket).
// It never parses logs, never touches SQLite, never computes analytics.
export const hub = new HubClient();
