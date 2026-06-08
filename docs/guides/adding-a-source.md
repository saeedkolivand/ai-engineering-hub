# Adding an ingestion source

A **source** is a tool (Claude Code, RTK, your custom script, etc.). Sources are **data, not code** — register one, enable it, and the collector reads its local data store and backfills history. New tools need zero Rust recompile.

## Three paths

1. **Built-in preset** (hardcoded parser) — fastest for well-known tools. Add a collector module.
2. **Mapping rules** (config-driven) — for tools with a predictable output format. No recompile.
3. **HTTP push** — any tool POSTs canonical `EventEnvelope`s. No local integration needed.

## Path 1: Built-in preset (e.g., adding a new tool like Aider)

### 1. Create the collector module

Add `apps/ai-engineering-hub/core/src/ingestion/collectors/aider.rs`:

```rust
//! Aider collector. Reads the session log at ~/.aider/chat_history.jsonl
use super::{home_dir, provider_for, repo_ref, CollectedEvent, Upsert};
use crate::error::AppResult;
use chrono::Utc;
use serde_json::{json, Value};
use shared_events::{EntityRefs, EventEnvelope};
use std::path::PathBuf;

pub struct Aider {
    root: Option<PathBuf>,
}

impl Aider {
    pub fn new() -> Self {
        Self {
            root: home_dir().map(|h| h.join(".aider")),
        }
    }

    pub async fn collect(&self) -> AppResult<Vec<CollectedEvent>> {
        // Read ~/.aider/chat_history.jsonl, parse lines, emit token_usage events.
        // Return early if the file doesn't exist (tool not installed).
        todo!()
    }
}
```

### 2. Register it in the collector loop

In `apps/ai-engineering-hub/core/src/ingestion/collectors/mod.rs`, add:

```rust
pub mod aider;
```

In `spawn()`, add a collector instance + poll logic:

```rust
let aider = aider::Aider::new();
// ... in the loop:
if enabled(&state, "aider").await {
    run_one(&state, "aider", aider.collect().await).await;
}
```

### 3. Add the source seed preset

In `apps/ai-engineering-hub/core/src/sources.rs`, in the `seed_sources()` function, insert:

```rust
"aider" => (
    "Aider",
    "cli",
    r#"{"emits_tokens":true,"emits_build_status":false}"#,
    None,
)
```

### 4. Wired. Test it.

```bash
cargo build --workspace
pnpm app:dev  # Enable Aider in Integrations; backfill should start in 5s
```

## Path 2: Mapping rules (config-driven, no recompile)

For tools that emit a JSON or CSV in a predictable format, use the `ConfigurableAdapter` — the user defines mapping rules in the UI, and a new tool integrates with zero code change.

### 1. Register the source with mapping rules

Manually insert into the `sources` table (or POST `/api/v1/sources`):

```json
{
  "key": "my-linter",
  "display_name": "My Custom Linter",
  "kind": "cli",
  "origin": "user_defined",
  "capabilities": {"emits_lint_status": true},
  "mapping_rules": {
    "event_type": "build",
    "payload_mapping": [
      {"jsonpath": "$.result", "target": "lint_status"}
    ]
  },
  "enabled": false
}
```

### 2. Point it at a watched directory

In **Integrations → Watched Directories**, add:

```
~/.my-linter/reports/*.json -> my-linter
```

### 3. Tool outputs JSON, ConfigurableAdapter maps it

Each file's JSON is parsed, the mapping rules extract fields, and canonical `EventEnvelope`s land in `raw_events`.

No code, no recompile.

## Path 3: HTTP push

Any tool can POST a canonical event:

```bash
curl -X POST http://127.0.0.1:47800/api/v1/ingest \
  -H "content-type: application/json" \
  -d '{
    "source": "my-tool",
    "event_type": "token_usage",
    "timestamp": "2026-06-08T12:00:00Z",
    "payload": {"tokens": 1500}
  }'
```

Unknown sources auto-register as `auto_detected` (disabled) in the **Integrations inbox** for the user to name/enable.

## Verify

- **Built-in:** backfill appears in Tasks/Overview after enabling.
- **Mapping rules:** watched directory picks up files and emits events.
- **HTTP:** curl response shows `{"ingested": 1}`; events appear live in Activity.

Related: [Integrations](../integrations.md) · [Architecture](../architecture.md) — Ingestion section
