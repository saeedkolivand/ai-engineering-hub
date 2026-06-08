---
name: analytics-standards
description: Analytics + repository-intelligence standards — metric definitions, dimensional SQL, views/indexes, hotspots. Load for analytics changes.
---

# Analytics standards

Authoritative: `design/domain_model.md` + `design/database_schema.md`.

## Coverage (all real, no mock)
- Tokens: daily/weekly/monthly × source/provider/agent/repository.
- Savings: per savings-capable source + total (capability-driven).
- Productivity: first-pass success, intervention rate, retry rate, task completion, build success, test success.
- Quality: build/test/lint success, regressions.
- Retrieval: accuracy, latency, savings.
- Intelligence: intervention/retry hotspots, expensive workflows/agents, retrieval bottlenecks, architecture hotspots.

## Rules
- **Dimensional uniformity** — every metric accepts `group_by ∈ {source, provider, agent, repository}`; named-tool views are filters over the dynamic `sources` set.
- **Correctness** — explicit numerator/denominator; divide-by-zero guards; consistent time bucketing.
- **Efficiency** — aggregate in SQL with indexes/views; no N+1; don't pull rows to sum in Rust; no full scans on `raw_events`.
- **No mock numbers** — endpoints read the DB.
