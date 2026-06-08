---
name: backend-standards
description: Rust/Tauri/Axum/SQLx backend standards — single-process Axum-in-Tauri, bounded contexts, typed errors, repository pattern, SQLite/migrations, observability. Load for changes under apps/ai-engineering-hub/src-tauri/src/**.
---

# Backend standards

Authoritative: `design/domain_model.md` + `design/database_schema.md` + `design/api_contracts.md`.

## Hard rules (HIGH if violated)
- **Single process** — Axum HTTP/WS runs inside Tauri (`tokio::spawn` in `setup()`), bound to `127.0.0.1` on the fixed port. No sidecars, no second executable, no Node/Python/Go service.
- **Rust-first** — ingestion, analytics, intelligence live in Rust; the renderer is presentation-only.
- **Typed errors** — no untyped `Result<_, String>` across boundaries; use the app error type. No `unwrap()`/`expect()` on fallible runtime paths.
- **Dynamic sources** — sources are registry rows + capabilities; never a hardcoded tool enum/match.
- **No mock data / `unimplemented!()`** in committed code.

## Structure
Bounded-context modules: `ingestion/`, `analytics/`, `intelligence/`, `routes/` (+ WS), `db`. Repository-pattern data access; thin service layer; DI via `AppState` (pool + broadcast sender). Contracts come from `packages/shared-*`.

## Data
Single canonical schema in `src-tauri/migrations/`. Migrations forward-safe and reversible-or-guarded. WAL + sensible pragmas. SQLite work off the async runtime. Index every hot query; use views for analytics aggregations.

## Observability
`tracing` spans, not ad-hoc logging. No secrets/paths/PII in logs (Path Privacy).
