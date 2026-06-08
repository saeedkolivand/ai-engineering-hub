# Security Policy

## Our security model

AI Engineering Hub is **local-first by design**:

- The API and WebSocket bind to **`127.0.0.1` only** — never `0.0.0.0`. They are not reachable
  from the network.
- All data stays on your machine in a local SQLite database under the app data directory. The
  Hub does **not** transmit your data anywhere.
- Collectors read your tools' local data stores **read-only** and never modify them.
- The Stream Deck plugin consumes the local API only; it has no filesystem or database access.

Because the server is unauthenticated and localhost-bound, treat anything that can run as your
user as trusted (the same trust boundary as the tools it reads).

## Supported versions

The project is pre-1.0; security fixes land on `main`. Please test against the latest `main`
before reporting.

## Reporting a vulnerability

Please **do not** open a public issue for security-sensitive reports.

1. Use GitHub's [private vulnerability reporting](https://github.com/saeedkolivand/ai-engineering-hub/security/advisories/new)
   ("Report a vulnerability") on the repository's **Security** tab.
2. Include a description, reproduction steps, affected component, and impact.

We aim to acknowledge reports within a few days and to keep you updated on remediation. Thank you
for helping keep users safe.
