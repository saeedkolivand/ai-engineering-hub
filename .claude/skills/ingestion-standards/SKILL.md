---
name: ingestion-standards
description: Dynamic metrics-ingestion standards — sources registry, SourceAdapter + ConfigurableAdapter (mapping_rules), HTTP push, file-watching, manual import, auto-detection. Load for ingestion changes.
---

# Ingestion standards

Authoritative: `design/event_contracts.md` + the `sources` migration + `packages/shared-events`.

## The principle
**Sources are data, not code.** A tool = a `sources` row. The 7 named tools are seed presets, not branches. A new tool must be addable with **zero recompile** via `mapping_rules` or HTTP push.

## Required
- **`SourceAdapter` trait**; a `ConfigurableAdapter` driven by `mapping_rules` (JSONPath/regex → canonical fields). Preset adapters only when a format truly needs code.
- **Three source-agnostic paths**: HTTP push `POST /api/v1/ingest` (canonical `EventEnvelope`); `notify` file-watcher over user dirs/globs; manual import.
- **Auto-detection**: unknown `source` key / pattern → `auto_detected` (disabled) row → Integrations inbox; bump `last_seen_at`/`event_count`.
- **Capability-driven**: savings/build/retrieval are declared via `capabilities`, written into `raw_events.payload`. No hardcoded per-tool savings columns.
- **Dimensions**: keep `source`, `provider`, `agent` distinct on `raw_events`.

## Don't
Add a match arm / enum variant per tool for ordinary formats. Crash the watcher/server on a malformed file/payload (validate, skip, log).
