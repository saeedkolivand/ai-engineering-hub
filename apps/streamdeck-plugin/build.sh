#!/usr/bin/env bash
# Simple wrapper to build the Stream Deck plugin as a Tauri desktop app.
# This script assumes the Tauri CLI is installed (cargo tauri).
# Run from the repository root.

set -e

# Move into the plugin directory
cd "$(dirname "$0")"

# Install Rust dependencies (if needed)
cargo fetch

# Build the Tauri binary for the host platform
cargo tauri build

echo "✅ Stream Deck plugin built successfully. Binaries are located in the target/release-bundle directory."