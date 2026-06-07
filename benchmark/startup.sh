#!/usr/bin/env bash
# Benchmark the Tauri application startup time.
# This script measures the elapsed time for the compiled Tauri binary to start and print
# "Tauri application started" (which is emitted by the Rust main.rs when the app is ready).

set -e

# Ensure cargo is on PATH (common location for rustup on Windows)
export PATH="$HOME/.cargo/bin:$PATH"

# Build the Tauri binary in release mode (if not already built)
# (Assume binary is already built; skip cargo invocation for benchmarking)

# Path to the generated binary (adjust if your target platform differs)
BINARY_PATH=$(find target/release-bundle -type f -name "ai-engineering-hub*$(uname | tr '[:upper:]' '[:lower:]')" | head -n1)
if [[ -z "$BINARY_PATH" ]]; then
  echo "❌ Could not locate the Tauri binary."
  exit 1
fi

echo "🔧 Benchmarking startup time for $BINARY_PATH"

# Use the built-in time command to measure real elapsed time.
# The binary prints a line when it has finished initialisation.
START_TIME=$(date +%s%3N)
"$BINARY_PATH" &

# Wait for the ready signal (max 10 s)
TIMEOUT=10
while true; do
  if grep -q "Tauri application started" <<< "$(ps -p $! -o args=)"; then
    break
  fi
  if (( $(date +%s%3N) - START_TIME > TIMEOUT * 1000 )); then
    echo "❌ Startup timeout after $TIMEOUT seconds."
    kill $! 2>/dev/null || true
    exit 1
  fi
  sleep 0.1
done

END_TIME=$(date +%s%3N)
ELAPSED_MS=$((END_TIME - START_TIME))
echo "🚀 Startup time: ${ELAPSED_MS} ms"

# Clean up the running instance
kill $! 2>/dev/null || true