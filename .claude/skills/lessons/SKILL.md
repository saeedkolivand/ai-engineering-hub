---
name: lessons
description: How to propose and query distilled lessons (the experiential memory). Only project-steward persists; every other agent proposes/queries.
---

# Lessons — distilled experiential memory

Store: `.claude/memory/lessons.jsonl` (local, capped 200, archived on overflow). **Only `project-steward` writes.**

## Query (any agent, on-demand)

```bash
node .claude/hooks/lessons.mjs query --domain ingestion
node .claude/hooks/lessons.mjs query --domain analytics
node .claude/hooks/lessons.mjs query --category Performance
node .claude/hooks/lessons.mjs query --text "sqlx migration"
```

Returns only matching ≤5-line lessons — never bulk-loaded. The review-gate auto-queries by touched domain/globs and folds matches into its prompt.

## Propose (any agent)

Surface as: `LESSON · <category> · Context: … · Decision: … · Outcome: …` (≤5 lines). `project-steward` dedupes & persists.

## Categories (exactly one)

Architecture decision · Failed approach · Proven approach · Performance · Security · Ingestion · Analytics · Contracts · Plugin · Testing discovery.

## Rules

- Distilled lessons only — **never** raw conversations / task-histories / review-outputs.
- `Context · Decision · Outcome`, ≤5 lines.
- Dedupe on add; cap 200 active; archive the rest.
- An **Architecture-decision** lesson that graduates to an ADR in `docs/` is **removed** from the log — the ADR becomes its single source.
- Context priority stays: graphify → source → docs/knowledge → lessons.
