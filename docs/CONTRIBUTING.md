# Contributing to AI Engineering Hub

Thank you for your interest in contributing! This project follows strict engineering standards to ensure a production‑grade platform.

## Prerequisites

- **Rust** stable (via `rustup`)  
- **Tauri CLI** (`cargo install tauri-cli`)  
- **Node.js** (v20+) and **pnpm** for the frontend  
- **SQLite** (bundled with SQLx)  

## Development Setup

```bash
# Clone the repo
git clone https://github.com/saeedkolivand/ai-engineering-hub.git
cd ai-engineering-hub

# Install frontend dependencies
cd apps/ai-engineering-hub/src/frontend
pnpm install

# Build backend
cd ../../..
cargo build

# Run the Tauri dev environment
cargo tauri dev
```

## Code Style

- Rust code is formatted with `cargo fmt` and linted with `cargo clippy`.  
- TypeScript follows the project's ESLint and Prettier configuration.  
- Use `#[deny(warnings)]` in CI to keep the codebase clean.

## Testing

```bash
# Backend tests
cargo test --workspace

# Frontend tests (Jest)
cd apps/ai-engineering-hub/src/frontend
pnpm test
```

## Pull Request Process

1. Fork the repository and create a feature branch.  
2. Ensure all tests pass and lints are clean.  
3. Open a PR with a clear description of the change.  
4. A senior staff engineer will review for architectural compliance.

## License

MIT © 2026 AI Engineering Hub Team