---
name: token-efficiency
description: Read-the-minimum discipline — graphify-first scoping, no repo-wide scans, stop at ~90% confidence. Load at the start of any review or implementation task.
---

# Token efficiency

## Scoping order
graphify (`query`/`explain`/`path`) → source (authoritative for edited regions) → `design/` + `docs/` → lessons. Read the **minimum**; **stop at ~90% confidence**.

## Rules
- No repo-wide greps/scans; scope with graphify first, then targeted reads.
- Prefer `graphify-out/wiki/index.md` for navigation over browsing source trees.
- Read only the regions you'll change or review; don't re-read files already in context.
- Use `rtk`-wrapped tools (`rtk rg`, `rtk fd`, `rtk bat`) for the savings tracking the platform itself measures.
- Don't restate large file contents back; cite `file:line`.
