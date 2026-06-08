# Integrations & Collectors

Tools are **data, not code**: every tool is a row in the `sources` registry. Enabling a
source does two things — it surfaces the tool in analytics, and (for tools with a built-in
collector) it **starts reading that tool's own local data store** on a 5-second poll.

> A source that is disabled is never read. A tool with no local data on the machine simply
> produces nothing — that's expected, not an error.

## How collection works

A background loop ([`core/src/ingestion/collectors/`](../apps/ai-engineering-hub/core/src/ingestion/collectors/))
polls each **enabled** source's collector. Each collector reads the tool's native store,
converts records to canonical `EventEnvelope`s, and persists them idempotently:

- **Idempotent** — every event has a deterministic id (e.g. `cc:<uuid>`, `rtk:<rowid>`), so
  re-scans and restarts use `INSERT OR IGNORE` and never double-count.
- **Incremental** — collectors tail by byte offset (JSONL), row id / timestamp (SQLite), or
  file mtime (per-task JSON), so steady-state polls are cheap.
- **Backfill** — on first enable the whole history is read once, then only new data.
- **Drill-down** — collectors upsert `repositories` / `sessions` / `agents` so the hierarchy
  populates, not just the headline metrics.

The headline `tokens` value is `input + output + cache_creation + cache_read`; the individual
components are kept in the event payload for future per-type breakdowns.

## Built-in collectors

| Source | Local data store (tool-standard location) | Emits | Notes |
|---|---|---|---|
| **Claude Code** | `~/.claude/projects/<slug>/*.jsonl` | `token_usage`, `task` | Tokens per assistant turn (`message.usage`); a **task** per user prompt (`promptId`) → the Tasks list + drill-down. Attributes repo (from `cwd`), session, model. |
| **RTK** | `%LOCALAPPDATA%/rtk/history.db` (`commands`) | `savings`, `retrieval` | A savings event per token-saving command; search/read/list commands also emit a **retrieval** event (latency + savings). Repo from `project_path`. |
| **OpenCode** | `~/.local/share/opencode/opencode.db` (`message`) | `token_usage` | Assistant messages; repo from session `directory`; real `providerID`/`modelID`. |
| **Cline** | `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/tasks/<id>/ui_messages.json` | `token_usage` | `api_req_started` token counts; workspace path isn't recorded, so attributed by task only. |
| **Gemini CLI** | `~/.gemini/telemetry.log` | `token_usage` | **Best-effort.** Only present if you opt into file telemetry (`telemetry.target=local` + `telemetry.outfile`). |

`provider` is inferred from the model id (`claude→anthropic`, `gemini/gemma→google`,
`gpt→openai`, `deepseek`, `qwen`, `llama→meta`, …) so it stays a meaningful analytics
dimension even when a tool routes to many model families.

## Metrics that show "—"

Rate/score metrics (Productivity, Quality, and retrieval accuracy) return `null` —
rendered "—" in the UI — when **no connected tool reports that signal**, which is distinct
from a real 0%. The installed tools don't emit build/test/lint outcomes, first-pass success,
intervention/retry counts, or retrieval accuracy, so those read "—" until a source provides
them (a CI/quality reporter or a `POST /api/v1/ingest` carrying `build_status`,
`test_status`, `lint_status`, `task_status`, `retries`, etc.). Tokens, savings, tasks, and
retrieval latency/savings are live from the collectors above.

## Tools without an event stream

**Graphify** and **CodeGraph** produce a per-project *index artifact* (a knowledge graph /
SQLite symbol index), not an ongoing token/savings event stream, so they have no built-in
collector. They remain registry presets; feed them metrics via the universal paths below.

## Universal ingestion (any tool, zero recompile)

For tools without a built-in collector — or your own homegrown scripts — push canonical
events directly. Unknown source keys auto-register (disabled) in the Integrations inbox.

```bash
curl -X POST http://127.0.0.1:47800/api/v1/ingest -H "content-type: application/json" \
  -d '{"source":"my-tool","event_type":"token_usage","timestamp":"2026-06-08T12:00:00Z","payload":{"tokens":1500}}'
```

A configurable, mapping-rule-driven adapter (`ConfigurableAdapter`) lets you map an arbitrary
JSON shape to canonical fields without code changes — see
[`core/src/ingestion/adapter.rs`](../apps/ai-engineering-hub/core/src/ingestion/adapter.rs).
