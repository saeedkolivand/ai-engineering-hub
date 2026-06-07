# Architecture Overview

The **AI Engineering Hub** is a single‑process Tauri v2 application written in Rust with a React + TypeScript frontend.

## Core Components

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Backend** | Rust (Axum, Tokio, SQLx, Tauri) | HTTP API, WebSocket streams, metrics collector, SQLite persistence |
| **Frontend** | React, TypeScript, TanStack suite | UI, routing, data fetching, virtualized tables, command palette |
| **Desktop Shell** | Tauri v2 | Bundles backend + frontend, provides native APIs |
| **Stream Deck Plugin** | Rust (Tauri) | Consumes Hub APIs via IPC, displays live metrics on a Stream Deck |

## Data Flow

1. **Metrics Collector** watches a `metrics/` folder, parses JSON logs and writes to SQLite.  
2. **Backend** serves REST endpoints and a WebSocket (`/ws/metrics`) that streams live events.  
3. **Frontend** uses TanStack Query to fetch data and TanStack Table to render large tables efficiently.  
4. **Stream Deck Plugin** invokes Tauri commands to fetch the latest metrics and renders them on a hardware device.

## Design Principles

- **Domain‑Driven Design** – Separate bounded contexts for metrics, analytics, repository intelligence.  
- **Clean Architecture** – `src/models`, `src/repository`, `src/service` layers with clearly defined boundaries.  
- **Event‑Driven** – Collector emits events via a broadcast channel consumed by WebSocket and UI.  
- **Observability** – Tracing with `tracing`/`tracing‑subscriber`.  
- **Testing** – Unit & integration tests for DB layer, API routes, and collector logic.