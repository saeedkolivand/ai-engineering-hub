# Analytics

Analytics are computed on demand over `raw_events` and served at `GET /api/v1/analytics`
(repository intelligence at `GET /api/v1/intelligence`). Implementation:
[core/src/analytics.rs](../apps/ai-engineering-hub/core/src/analytics.rs) and
[core/src/intelligence.rs](../apps/ai-engineering-hub/core/src/intelligence.rs).

## Dimensions

Every breakdown groups by one of four **independent** dimensions:

| Dimension | Source |
| --- | --- |
| `source` | The tool key (`raw_events.source`) |
| `provider` | The model vendor (`agents.provider`, inferred from the model id) |
| `agent` | The model (`agents.name`) |
| `repository` | The repo (`repositories.name`) |

`source ≠ provider ≠ agent`: e.g. Claude Code (source) may route to `anthropic` (provider) using
`claude-opus-4-8` (agent). The Analytics page lets you switch the token breakdown across all four.

## Categories

| Category | Fields | Fed by |
| --- | --- | --- |
| **Tokens** | daily / weekly / monthly usage + breakdowns by all four dimensions | `token_usage` events |
| **Savings** | total + by source | `savings` events (savings-capable sources) |
| **Productivity** | first-pass success, intervention rate, retry rate, task completion, build/test success | events carrying those fields |
| **Quality** | build / test / lint success, regressions | events carrying `*_status` / `regression` |
| **Retrieval** | accuracy, avg latency, savings | `retrieval` events |

The `tokens` value sums `input + output + cache_creation + cache_read`; the components are kept in
the event payload for future per-type breakdowns.

## The "—" semantics (important)

Rate/score fields are **`null` (rendered "—") when no connected tool reports that signal yet** —
deliberately distinct from a real `0%`.

- Token usage, savings, tasks, and retrieval latency/savings are **live** from the built-in
  collectors.
- Productivity and Quality rates, and retrieval **accuracy**, read **"—"** because the installed
  tools don't emit build/test/lint outcomes, first-pass success, intervention/retry counts, or
  retrieval accuracy.

They populate the moment a source provides them — a CI/quality reporter, or a `POST /api/v1/ingest`
carrying `build_status`, `test_status`, `lint_status`, `task_status`, `retries`, etc. Each rate is
computed over a **field-present denominator** (only events that carry the field), so the percentage
is correct as soon as data exists.

```jsonc
// Example payloads that light up the empty widgets:
{ "source": "ci", "event_type": "build", "payload": { "build_status": "success" } }
{ "source": "ci", "event_type": "test",  "payload": { "test_status": "success" } }
{ "source": "my-agent", "event_type": "task", "payload": { "task_status": "completed", "retries": 0 } }
```

## Repository intelligence

`GET /api/v1/intelligence` returns aggregations for spotting problem areas:

- **intervention_hotspots** — repos with the most interventions
- **retry_hotspots** — repos with the most retries
- **expensive_agents** — agents/models by total tokens
- **retrieval_bottlenecks** — sources by average retrieval latency

## Adding a metric

See [guides/adding-a-metric.md](guides/adding-a-metric.md): type in `shared-types` (TS + Rust),
query in `analytics.rs`, expose via the route, render a table column.
