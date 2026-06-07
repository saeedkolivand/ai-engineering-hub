# AI Engineering Hub

A production‑grade AI Engineering Operations Platform built with:

- **Rust / Tauri v2** – single binary desktop app
- **Axum + Tokio + SQLx + SQLite** – backend services
- **React + TypeScript + TanStack Stack** – frontend UI
- **Shared UI package** – reusable components (`packages/shared-ui`)
- **Stream Deck plugin** – live metric display via WebSocket

## Architecture Overview

```
apps/
 └─ ai-engineering-hub/
    ├─ src/
    │   ├─ backend/            # Rust backend (Axum, SQLx, Tokio)
    │   └─ frontend/           # React + Vite + TanStack
    │        ├─ src/
    │        │   ├─ components/
    │        │   └─ routes/
    │        └─ vite.config.ts
    └─ Cargo.toml               # Tauri config & workspace
packages/
 └─ shared-ui/                 # UI components (Card, NavBar, Layout)
```

## Development

### Prerequisites

- **Rust** (stable) and **cargo**
- **Node.js** (≥18) with **pnpm** (or npm)
- **Tauri CLI** (`cargo install tauri-cli`)

### Backend

```bash
cd apps/ai-engineering-hub/src/backend
cargo run            # Starts Axum server on http://localhost:3000
```

### Frontend

```bash
cd apps/ai-engineering-hub/src/frontend
pnpm install         # Installs React dependencies
pnpm dev             # Starts Vite dev server (http://localhost:5173)
```

The frontend proxies API calls to the Rust backend.

### Stream Deck Plugin

The plugin lives in `apps/ai-engineering-hub/src/frontend/src/plugins/streamdeck.ts`.  
It connects to `ws://localhost:3000/ws/metrics`. Build the plugin according to the
official Stream Deck SDK documentation.

## Building the Desktop Application

```bash
cd apps/ai-engineering-hub
pnpm install          # Ensures all workspace packages are installed
pnpm tauri dev        # Runs the Tauri app in development mode
pnpm tauri build      # Produces a signed binary for the host OS
```

## Testing

- **Backend:** `cargo test` in the backend directory.
- **Frontend:** `pnpm test` (Jest + React Testing Library).
- **E2E:** Use Playwright to run UI tests against the running Tauri app.

## Documentation

- `docs/architecture.md` – detailed domain and bounded‑context model.
- `docs/api.md` – OpenAPI spec for backend endpoints.
- `docs/streamdeck.md` – Integration guide for the Stream Deck plugin.

## License

MIT © AI Engineering Hub Team