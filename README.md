# AI Engineering Hub

## Overview

The AI Engineering Hub is a production-grade AI Engineering Operations Platform designed to function as:

- **AI Engineering Command Center**
- **Metrics Collector**
- **Analytics Engine**
- **Repository Intelligence Platform**
- **Local API Platform**
- **WebSocket Platform**
- **Stream Deck Data Source**
- **Foundation for Future Integrations**

The platform is built using Rust, Tauri, Tokio, Axum, SQLx, and SQLite, ensuring high performance, reliability, and scalability. The frontend is developed with React, TypeScript, and TanStack libraries, providing a robust and efficient user interface.

## Features

- **Metrics Collection**: Collects metrics from various AI tools (Claude Code, OpenCode, Cline, Gemini CLI, RTK, Graphify, CodeGraph).
- **Analytics Engine**: Calculates tokens, savings, productivity, quality, and retrieval metrics.
- **Repository Intelligence**: Provides deep analytics on repositories, including intervention and retry hotspots.
- **Activity System**: Live activity feed and timeline views for repositories, sessions, tasks, and agents.
- **Stream Deck Integration**: Monitor key metrics via a Stream Deck plugin.
- **Command Palette**: Global search and command execution with keyboard shortcuts.
- **Three-Panel Layout**: Left navigation, center content, and right context panel.

## Architecture

- **Backend**: Rust, Tauri, Tokio, Axum, SQLx, SQLite.
- **Frontend**: React, TypeScript, TanStack Router, TanStack Query, TanStack Table, TanStack Virtual, TanStack Form, TanStack Store, TanStack Start, TanStack Config.
- **Shared Packages**: Types, events, API contracts, SDK, design tokens.

## Getting Started

### Prerequisites

- Rust and Cargo: [Install Rust](https://www.rust-lang.org/tools/install)
- Node.js and npm: [Install Node.js](https://nodejs.org/)
- SQLite: [Install SQLite](https://www.sqlite.org/download.html)

### Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/ai-engineering-hub.git
   cd ai-engineering-hub
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cargo install
   ```

3. **Set Up the Database**
   ```bash
   sqlx database create
   sqlx migrate run
   ```

4. **Start the Development Server**
   ```bash
   npm run tauri dev
   ```

### Building for Production

1. **Build the Application**
   ```bash
   npm run tauri build
   ```

2. **Run the Application**
   ```bash
   ./target/release/ai-engineering-hub
   ```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## Documentation

- **Architecture Documentation**: `docs/architecture.md`
- **API Documentation**: `docs/API_REFERENCE.md`
- **Database Schema**: `docs/database_schema.md`
- **Stream Deck Documentation**: `docs/streamdeck.md`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or suggestions, please open an issue or contact the maintainers directly.

---

**Note**: This README is a starting point and should be expanded with more detailed instructions, diagrams, and examples as the project evolves.