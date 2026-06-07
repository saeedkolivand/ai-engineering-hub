# API Reference

All backend endpoints are served by **Axum** and are reachable under the `/api/v1/` prefix.

## Authentication

> **Note:** Authentication is out‑of‑scope for this MVP. All endpoints are currently unauthenticated.

## Endpoints

| Method | Path | Description | Returns |
|--------|------|-------------|---------|
| `GET` | `/api/v1/repositories` | List all repositories | `Repository[]` |
| `GET` | `/api/v1/repositories/:id` | Get repository details | `Repository` |
| `GET` | `/api/v1/sessions?repoId=…` | List sessions for a repository | `Session[]` |
| `GET` | `/api/v1/tasks?sessionId=…` | List tasks for a session | `Task[]` |
| `GET` | `/api/v1/agents` | List all agents | `Agent[]` |
| `GET` | `/api/v1/metrics?category=…` | List metrics filtered by `category` (e.g. `token`, `savings`, …) | `Metric[]` |
| `GET` | `/api/v1/health` | Health‑check – returns `200 OK` when the service is up | `{ status: "OK" }` |

### Data Types (JSON)

```json
// Repository
{
  "id": "string",
  "name": "string",
  "path": "string",
  "created_at": 1700000000
}

// Session
{
  "id": "string",
  "repository_id": "string",
  "started_at": 1700000000,
  "ended_at": null
}

// Task
{
  "id": "string",
  "session_id": "string",
  "name": "string",
  "status": "string",
  "created_at": 1700000000
}

// Agent
{
  "id": "string",
  "name": "string",
  "status": "string",
  "last_seen": 1700000000
}

// Metric
{
  "id": "string",
  "type": "string",
  "value": "number|string",
  "unit": "string?",
  "timestamp": 1700000000,
  "category": "string"
}
```

## Error handling

All endpoints return standard HTTP status codes:

* `200` – Success
* `400` – Bad request (invalid query parameters)
* `404` – Not found
* `500` – Internal server error (logged in the Tauri console)

## WebSocket Events

The server also exposes a **WebSocket** at `/ws/events`. Each message is a JSON‑encoded `EventEnvelope<T>`:

```json
{
  "type": "string",          // e.g. "metric", "task_update"
  "timestamp": 1700000000,
  "payload": { … }           // Typed payload (Metric, Task, etc.)
}
```

Clients (frontend & Stream Deck plugin) subscribe to this stream to receive real‑time updates.

---

### How to regenerate API docs

The Rust Axum router is annotated with OpenAPI comments (see `src-tauri/router.rs`). Run:

```bash
cargo install cargo-openapi
cargo openapi > docs/openapi.json
npx widdershins docs/openapi.json -o docs/API_REFERENCE.md
```

This will keep the Markdown in sync with the source code.<write_to_file>
<path>docs/ARCHITECTURE.md</path>
<content>
# Architecture Overview

The **AI Engineering Hub** is a single‑process, production‑grade application built with the following mandatory stack:

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Desktop Runtime** | **Tauri v2** (Rust) | Small native binary, no Electron overhead, full access to OS APIs. |
| **Backend** | **Axum 0.7**, **Tokio**, **SQLx**, **SQLite** | Asynchronous HTTP server, zero‑cost futures, type‑safe async DB access, embedded DB for easy distribution. |
| **Database** | **SQLite** (WAL mode) | Single‑file, ACID‑compliant, great for local analytics workloads. |
| **Frontend** | **React 18**, **TypeScript**, **TanStack** (Router, Query, Table, Virtual, Form, Store, Start, Config) | Modern UI, type‑safe routing, declarative data fetching, virtualized tables for millions of rows. |
| **Shared Contracts** | **packages/shared‑types**, **shared‑events**, **shared‑api‑contracts**, **shared‑sdk** | Guarantees identical type definitions across the Tauri backend, React UI, and Stream Deck plugin. |
| **Stream Deck Plugin** | **Tauri** (separate app), **React**, **WebSocket** | Consumes the same live event stream without touching SQLite or logs, meeting the “no direct DB access” constraint. |
| **Observability** | **Event Bus** (broadcast channel) → WebSocket | Real‑time activity feed, timeline, and monitor UI‑components. |
| **Testing / CI** | **Vitest**, **Cargo test**, **GitHub Actions** | Automated unit, integration, and UI tests; CI runs on Windows (the target platform). |

## High‑level Diagram

```
+---------------------------+        +----------------------+        +-------------------+
|  Tauri Desktop Process    |        |  Axum HTTP Server    |        |  SQLite Database |
| (Rust + WebView)          |<-----> | (REST + WS endpoints)|<-----> | (WAL mode)       |
|                           |        |                      |        |                   |
| +-----------------------+ |        | +------------------+ |        | +---------------+ |
| | React Front‑end (TS)  | |        | | Router (API)    | |        | | Metrics, etc | |
| | TanStack UI Stack     | |        | +------------------+ |        | +---------------+ |
| +-----------------------+ |        | +------------------+ |        +-------------------+
|                           |        | | WebSocket Events| |
| +-----------------------+ |        | +------------------+ |
| | Stream Deck Plugin    | |        +----------------------+
| | (React UI)            | |
| +-----------------------+ |
+---------------------------+
```

* The **frontend** and **Stream Deck** both connect via WebSocket to receive live metrics.
* All data is stored in the **SQLite** file `metrics.db` located in the user data directory (managed by Tauri).
* The **backend** runs in a background Tokio task inside the same Tauri process, eliminating the need for side‑car processes.

## Key Architectural Decisions

1. **Single‑process design** – avoids sidecars, simplifies deployment and satisfies the “no additional executables” rule.
2. **WAL journaling + prepared statements** – ensures high concurrency and fast reads/writes for large event streams.
3. **TanStack Virtual** – renders millions of rows with sub‑millisecond scroll latency.
4. **Domain‑Driven Design** – core domain concepts (Repository, Session, Task, Agent, Metric) live in `design/domain_model.md` and map 1:1 to SQLite tables.
5. **Event‑Driven** – every analytical calculation publishes an `EventEnvelope` which the UI can consume instantly.

---

### Updating the Architecture Document

Whenever a new bounded context or major component is added:

1. Extend `design/domain_model.md` with the new entity.
2. Add the corresponding SQLite table and indexes in `src-tauri/migrations/`.
3. Update the **Axum** router (`src-tauri/router.rs`) and publish the new event type.
4. Add a visual block to this diagram and describe the data flow.

This keeps the architecture documentation aligned with the code base.<write_to_file>
<path>docs/DEPLOYMENT.md</path>
<content>
# Deployment Guide

The AI Engineering Hub is a **single‑binary Tauri application** (desktop) plus an optional Stream Deck plugin. No external services, side‑cars, or cloud dependencies are required.

## Prerequisites

| Platform | Required |
|----------|----------|
| Windows 11 (x64) | ✅ Built‑in |
| macOS 13+ (ARM/x64) | ✅ Built‑in |
| Linux (glibc ≥ 2.31) | ✅ Built‑in |
| Rust toolchain (stable) | `rustup default stable` |
| Node 20 LTS | `npm i -g pnpm` |
| Tauri CLI | `cargo install tauri-cli` |

## Building the Application

```bash
# 1️⃣ Install Node dependencies (frontend, Stream Deck UI)
pnpm install --frozen-lockfile

# 2️⃣ Build the React frontend (produces dist/ for the Tauri WebView)
pnpm run build   # runs Vite build

# 3️⃣ Build the Rust side (includes Axum server & SQLite pool)
cargo build --release

# 4️⃣ Package the Tauri app (creates installer bundles)
cargo tauri build --release
```

The resulting installers are placed under `target/release-bundle/<platform>/`.  
Examples:

* `target/release-bundle/msi/ai-engineering-hub_x64.msi`
* `target/release-bundle/dmg/ai-engineering-hub_x64.dmg`
* `target/release-bundle/appimage/ai-engineering-hub_x86_64.AppImage`

## Building the Stream Deck Plugin

The plugin is a separate Tauri project located in `apps/streamdeck-plugin`.

```bash
cd apps/streamdeck-plugin
# Install its own Node dependencies if any
pnpm install --frozen-lockfile

# Run the provided wrapper script (creates a native binary)
./build.sh
```

The binary (and accompanying `icon.png`) will be placed in `target/release-bundle/`.  
Copy the resulting executable to the Stream Deck Software “Plugins” folder:

```
%APPDATA%/Elgato/StreamDeck/Plugins/
```

Then restart the Stream Deck application – the new monitors will appear.

## Configuration

| Setting | Location | Description |
|---------|----------|-------------|
| `DATABASE_URL` | Environment variable (or `.env` in the project root) | Path to the SQLite file, defaults to `sqlite:metrics.db` in the Tauri data directory. |
| `API_PORT` | Environment variable | Port for the Axum HTTP server; Tauri binds to a random OS‑assigned port (`127.0.0.1:0`). |
| `WS_PORT` | Same as API (shared server) | WebSocket shares the same port as the REST API. |

### Example `.env`

```
DATABASE_URL=sqlite:/Users/saeed/.local/share/ai-engineering-hub/metrics.db
```

## Runtime Requirements

* **CPU:** ≥ 2 vCPU (recommended for simultaneous metric ingestion & UI rendering)
* **Memory:** ≥ 256 MiB (typical usage < 100 MiB)
* **Disk:** ≤ 50 MiB for the binary + SQLite DB (growth depends on collected metrics)

## Updating the Release

1. Increment the version in `src-tauri/Cargo.toml` and `package.json`.
2. Create a Git tag: `git tag -a vX.Y.Z -m "Release X.Y.Z"` and push it.
3. GitHub Actions (see `.github/workflows/ci.yml`) will automatically:
   - Run tests,
   - Build the Tauri binaries,
   - Upload artefacts as a GitHub Release.

## Post‑install Checks

1. Launch the app – it should display the three‑panel UI.
2. Open the **Command Palette** (`Ctrl+K`) and verify navigation works.
3. Open the **Stream Deck** plugin window – ensure all monitors show live data (dummy data appears if the backend is not generating real metrics).
4. Run the startup benchmark: `npm run benchmark:start` (should be < 2000 ms).
5. Run the virtual list benchmark: `npm run benchmark:list` (first render < 100 ms, scroll < 20 ms).

If any of the checks fail, consult the logs (`tauri dev` console) and verify that the SQLite file is writable and that the WebSocket endpoint is reachable (`ws://127.0.0.1:<port>/ws/events`). 

---

**Happy engineering!**