/**
 * Stream Deck Plugin entry point.
 * This file defines the minimal API surface for the companion
 * Electron‑free Stream Deck plugin. It only consumes the Hub's
 * HTTP API and WebSocket streams – no direct DB or analytics logic.
 */

import { createConsumer } from '@zsa/streamdeck';
import type { HubEvent } from '@/shared-api-contracts'; // placeholder import

// Register a consumer that receives live metric updates
export const register = createConsumer({
  // The plugin will listen to a WebSocket endpoint exposed by the Hub
  // and surface the most recent token usage, savings, and health.
  websocketUrl: 'ws://localhost:3000/ws/metrics',
  onMessage: (event: HubEvent) => {
    // Forward relevant parts to Stream Deck UI via the SDK
    // Example payload:
    // { type: 'tokenUsage', value: 12345 }
    // The actual UI rendering is defined in the Stream Deck JSON manifest.
    // Here we only forward raw data; the deck UI will handle display.
    window.sendToPropertyInspector(event);
  },
});

export default register;