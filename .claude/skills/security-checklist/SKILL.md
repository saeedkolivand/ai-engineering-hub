---
name: security-checklist
description: Security review checklist for the hub — Axum routes, IPC, WS, deps, credentials, AI ingestion, plugin boundaries. Load when reviewing security-sensitive changes.
---

# Security checklist

Severity bias for security/data findings = round **UP**.

## Risk assessment (every change)

- What assets / user data are affected? What attack surface changes (new Axum route, new IPC command, new WS message type)? What abuse opportunities open?

## Validation

- Inputs validated at every Axum handler entry point · outputs sanitized · IPC command inputs validated via Tauri's type system · permissions minimized · secrets protected · errors handled securely (no secrets/PII in logs) · dependencies reviewed.

## Axum / WebSocket surface

- All Axum routes authenticated or explicitly public-by-design · WS message types validated (no raw JSON forwarding) · CORS locked to `localhost` only (plugin never crosses origins) · rate limiting on ingestion POST endpoints · no unbounded buffering on WS streams.

## Plugin boundary enforcement

- Plugin communicates via `shared-sdk` only · plugin MUST NOT access SQLite directly · plugin MUST NOT compute analytics · plugin MUST NOT parse log files · no credentials forwarded from Hub to plugin.

## Abuse / cost (DoS & spend)

- Rate limits / request throttling on ingest endpoints? Unbounded ingestion queue? Can a tool spam events and exhaust CPU/memory/disk?

## Data

- Metrics/telemetry data protected at rest (SQLite file permissions) · no PII in metrics unless explicit and documented · temp files cleaned up · data retention and deletion honored.

## Desktop / supply chain

- `tauri.conf.json` CSP intact (Hub bound to localhost only) · `capabilities/` least-privilege · updater signing key + `latest.json` integrity · `deny.toml` / `cargo audit` / `pnpm audit` clean · new deps license-checked.

## Tauri IPC commands

- Every new Tauri command in `src-tauri/src/commands/` has scoped capability in `capabilities/` · no shell or filesystem access beyond what's declared · no forwarding of raw user input to the Axum server without validation.
