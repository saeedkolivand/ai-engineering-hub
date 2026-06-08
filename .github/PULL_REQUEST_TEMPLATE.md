<!-- Thanks for contributing! Keep PRs focused on one logical change. -->

## What & why

<!-- What does this change and why? Link any related issue: Closes #123 -->

## How to test

<!-- Commands / steps a reviewer can run to verify. -->

## Checklist

- [ ] Conventional Commit title (`feat:`, `fix:`, `docs:`, …)
- [ ] Builds pass: `cargo build --workspace` and `pnpm build`
- [ ] Typecheck passes (`tsc --noEmit`) for any frontend/plugin changes
- [ ] Shared contracts kept in **TS ↔ Rust parity** (if touched)
- [ ] No hardcoded tool enums, no raw hex, no mock/placeholder data
- [ ] Docs updated if behavior or contracts changed
