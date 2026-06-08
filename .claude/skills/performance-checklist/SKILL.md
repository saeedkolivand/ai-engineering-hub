---
name: performance-checklist
description: Performance review checklist for the hub — ingestion throughput, analytics queries, WS back-pressure, SQLite discipline, TanStack rendering. Load for perf-sensitive changes.
---

# Performance checklist

Bias perf findings toward MEDIUM unless there's a concrete on-a-hot-path regression.

## Async runtime (HIGH if blocking)

- No blocking I/O or CPU-bound work on the Tokio runtime — use `spawn_blocking` / the data layer. SQLite queries never block the async runtime (use `sqlx` with async or `spawn_blocking`).

## Ingestion hot path

- Adapter `ingest()` implementations must be bounded: no unbounded channels, no per-event heap allocations in the fast path.
- `ConfigurableAdapter` mapping rules evaluated without re-parsing config on every event.
- Auto-detect logic (Integrations inbox) must not block the ingest path — run off-thread.

## Analytics / queries

- Queries are dimensional (source/provider/agent/repo) and indexed — no full-table scans on warm paths.
- No N+1 queries: batch-load related rows, use CTEs or sub-selects.
- Repository intelligence (`intelligence.rs`) runs asynchronously and never blocks the HTTP response path.

## WebSocket streaming

- WS broadcast uses a bounded channel (Tokio `broadcast`); slow subscribers are dropped, not buffered indefinitely.
- Large payloads (bulk metric dumps) chunked or paginated, not sent as one frame.

## Frontend (TanStack)

- TanStack Query `staleTime`/`gcTime` tuned (desktop: disable refetch-on-window-focus).
- Large lists use TanStack Virtual — never render all rows into the DOM.
- TanStack Table column definitions stable (not re-created on every render).
- Avoid needless re-renders: stable deps, `React.memo` where measured.

## Token / AI efficiency

- If any AI calls exist: minimize prompt/context size; reuse cached context; don't resend unchanged context.
