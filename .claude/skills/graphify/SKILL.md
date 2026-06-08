---
name: graphify
description: How to use the graphify knowledge graph for codebase questions. Load before any broad codebase exploration.
trigger: /graphify
---

# graphify — knowledge graph queries

Graph lives at `graphify-out/`. Always query before grepping raw files.

## Commands

```bash
graphify query "<question>"          # BFS — broad context, nearest neighbors first
graphify query "<question>" --dfs    # DFS — trace a specific chain
graphify path "<A>" "<B>"            # shortest path between two concepts
graphify explain "<concept>"         # plain-language explanation of a node
graphify update .                    # re-index after code changes (AST-only, no API cost)
```

## When to use which

- "What is X / where is X defined?" → `graphify query`
- "How does X reach Y / the flow from X to Y?" → `graphify path`
- "What is X connected to?" → `graphify explain`
- After code changes → `graphify update .`

## Broad navigation

- `graphify-out/wiki/index.md` — community index, use for navigation before source browsing.
- `graphify-out/GRAPH_REPORT.md` — full architecture narrative, god nodes, surprising connections. Read only for broad architecture review.

## Rules

- Query the graph **before** reading raw files for any "where is X" or "how does X connect to Y" question.
- `graphify update .` is cheap (AST-only). Run it after every code change to keep the graph current.
