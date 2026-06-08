---
description: Add an ingestion source (registry row + mapping/preset — no recompile path preferred)
argument-hint: <tool name + log/JSON format notes>
---

Add source: **$ARGUMENTS**

Follow the **New ingestion source** checklist with `ingestion-source-expert` + skill `ingestion-standards`:
1. Add a `sources` seed/preset row with `capabilities` (emits_tokens/savings/build/test/lint/retrieval).
2. Prefer **`mapping_rules`** (JSONPath/regex → canonical fields) for the `ConfigurableAdapter` — **no Rust recompile**. Only add a preset adapter if the format genuinely needs code.
3. Confirm auto-detection surfaces the source in the Integrations inbox.
4. Add/verify the Integrations UI entry (enable/map).
5. Verify with the dynamic-source check: push a sample event → it lands in `raw_events` and appears as a `source` dimension.
6. Build green → `/review-ingestion` → `/update-graph`.
