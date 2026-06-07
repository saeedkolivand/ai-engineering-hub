# AI Engineering Hub Documentation

## Architecture Overview
- **Backend**: Rust + Tauri v2, Tokio, Axum, SQLx, SQLite.
- **Frontend**: React 18, TypeScript, TanStack (Router, Query, Table, Virtual, Form, Store, Start, Config).
- **Shared Packages**: `shared-types`, `shared-events`, `shared-api-contracts`.
- **Stream Deck Plugin**: React + TypeScript consuming the WebSocket event stream.
- **Analytics**: Placeholder services in `src/backend/src/service/analytics.rs`.

## Getting Started

```bash
# Backend (Tauri)
cd apps/ai-engineering-hub/src-tauri
cargo run

# Frontend (dev server)
cd apps/ai-engineering-hub/src/frontend
pnpm install
pnpm dev
```

## Build & Release
```bash
# Tauri build for all platforms
cd apps/ai-engineering-hub/src-tauri
cargo tauri build
```

## Testing
- Rust unit & integration tests: `cargo test --workspace`
- Frontend tests: `pnpm test` (Vitest)
- CI pipelines are defined in `.github/workflows/ci.yml` (to be added).

## Future Work
- Complete the remaining TanStack Table views for Sessions, Tasks, Agents, Metrics.
- Implement full analytics endpoints (savings, productivity, quality, retrieval).
- Expand Stream Deck UI with all monitor components.
- Add comprehensive test suites and CI pipeline.
- Polish design system using `shared-design-tokens`.