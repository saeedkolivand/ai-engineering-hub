import { HubClient, DEFAULT_HUB_PORT } from "shared-sdk";

// The Hub's Axum server runs inside the Tauri process on a fixed localhost port.
export const HUB_PORT = DEFAULT_HUB_PORT;
export const HUB_BASE = `http://127.0.0.1:${HUB_PORT}`;
export const hub = new HubClient({ baseUrl: HUB_BASE });
