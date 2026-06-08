---
name: contracts-parity
description: Shared-contract standards — TS↔Rust parity, single source of truth, endpoint/SDK/event completeness, dynamic-source contracts. Load for changes under packages/shared-*.
---

# Contracts parity

Authoritative: `design/api_contracts.md` + `design/event_contracts.md`.

## Rules
- **TS↔Rust parity** — `shared-types` and `shared-events` define the same shapes in both languages (field names, optionality, enum variants). Change both together.
- **Single source of truth** — hub, backend, and plugin import from `packages/shared-*`. Never redefine a contract in a route/component/monitor.
- **Completeness** — every Hub endpoint has a `shared-api-contracts` request/response; `shared-sdk` wraps every endpoint the plugin/external tools use; `EventEnvelope` covers ingest + WS and self-declares `source` + entity refs.
- **Dynamic-source contracts** — `Source`, `SourceCapabilities`, `MappingRule` exist and are consumed by ingestion, the Integrations UI, and `ingest()`.
- **Boundaries** — `shared-types`/`shared-events`: no UI/Node. `shared-design-tokens`: no React. `shared-sdk`: no UI.

## Build
Shared packages build via tsup / Vite lib mode (not `@tanstack/config`).
