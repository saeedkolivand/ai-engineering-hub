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
| **Productivity** | intervention rate, build/test success *(live)*; task completion, first-pass success, retry rate *(external push only)* | `build`/`test`/`intervention` events (Claude Code collector); `task` events or `POST /api/v1/ingest` for the rest |
| **Quality** | build / test / lint success, regressions *(live)*; | `build`/`test`/`lint` events (Claude Code collector) |
| **Retrieval** | accuracy *(external push only)*, avg latency, savings | `retrieval` events; accuracy requires external evaluator push |

The `tokens` value sums `input + output + cache_creation + cache_read`; the components are kept in
the event payload for future per-type breakdowns.

## The "—" semantics (important)

Rate/score fields are **`null` (rendered "—") when no connected tool reports that signal yet** —
deliberately distinct from a real `0%`.

**Live — derived by the Claude Code collector from its Bash tool-results:**

- **Quality**: build success/failure (`build_status`), test success/failure + regressions
  (`test_status`, `regression`), lint success/failure (`lint_status`).
- **Productivity**: build success, test success, intervention rate (emitted on
  `[Request interrupted by user]` / interrupted tool results, carrying a `reason` field).
- **Intelligence**: `intervention_hotspots` (fed by the same `intervention` events).

**Still "—" until fed by an external CI reporter or `POST /api/v1/ingest`:**

- Productivity: `task_completion_rate`, `first_pass_success`, `retry_rate` — no honest local signal
  exists in the Claude Code JSONL; they require an external task/CI reporter.
- Retrieval `accuracy` — populated only when a source or evaluator pushes `$.accuracy` on
  `retrieval` events.

Each rate is computed over a **field-present denominator** (only events that carry the field), so
the percentage is correct as soon as any data exists — partial coverage is fine.

```jsonc
// Example payloads for the "still —" fields:
{ "source": "ci",     "event_type": "task",      "payload": { "task_status": "completed", "retries": 0 } }
{ "source": "ci",     "event_type": "build",     "payload": { "build_status": "success", "command": "npm run build" } }
{ "source": "my-eval","event_type": "retrieval", "payload": { "accuracy": 0.92 } }
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
