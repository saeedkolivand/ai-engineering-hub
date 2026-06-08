# Releasing & auto-update

Releases are built for **Windows, macOS, and Linux** plus the **Stream Deck plugin**, published to
the [GitHub Releases](https://github.com/saeedkolivand/ai-engineering-hub/releases) page, and
existing desktop installs **auto-update**.

## Versioning policy

The project stays in the **`0.x.x`** range permanently — **the leading `0.` never changes.**

| Change | Bump | Example |
| --- | --- | --- |
| Breaking / "major" | second segment | `0.1.4` → `0.2.0` |
| Feature / fix ("minor"/"patch") | third segment | `0.2.0` → `0.2.1` |

We never release `1.x.x`. One command keeps **every** version field in sync (root + workspace
`package.json`s, the Cargo workspace, `tauri.conf.json`, and the Stream Deck `manifest.json`,
which gets a 4-segment `x.y.z.0`):

```bash
pnpm version:set 0.2.0     # validates the 0.x.x rule, rewrites all version fields
```

The script rejects anything that doesn't match `0.x.y`.

## Cutting a release

```bash
pnpm version:set 0.2.0
git commit -am "chore(release): 0.2.0"
git tag v0.2.0
git push origin main --tags
```

Pushing the `v*.*.*` tag triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml),
which:

1. Builds signed installers on `windows-latest`, `macos-latest` (universal), and `ubuntu-22.04`.
2. Creates the GitHub Release for the tag and uploads every installer **plus the updater
   `latest.json` and signatures**.
3. Packages and attaches `com.aiengineering.monitor.streamDeckPlugin`.

## One-time setup: signing secrets

Auto-update requires **signed** artifacts. A signing keypair has already been generated; the
**public** key is committed in
[`tauri.conf.json`](../apps/ai-engineering-hub/src-tauri/tauri.conf.json) (`plugins.updater.pubkey`),
and the **private** key lives in the git-ignored `.tauri-signing.key`. Add it (and its password)
as repository secrets — these commands read the file without printing it:

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < .tauri-signing.key
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --body ""   # empty unless you set one
```

> Keep `.tauri-signing.key` safe and never commit it. To rotate keys, regenerate with
> `pnpm tauri signer generate -w .tauri-signing.key`, update the `pubkey` in `tauri.conf.json`,
> and re-set the secret. Clients can only update to builds signed by the matching key.

## How auto-update works

- The app's updater is configured with an endpoint pointing at the release's `latest.json`
  (`releases/latest/download/latest.json`) and the public key.
- On startup, the packaged app checks that endpoint
  ([lib/updater.ts](../apps/ai-engineering-hub/src/frontend/src/lib/updater.ts)); if a newer signed
  build exists, it prompts to download, install, and relaunch.
- In the browser/dev (`pnpm dev`), the check is a no-op.

Plugins: [`tauri-plugin-updater`](https://github.com/tauri-apps/plugins-workspace) +
`tauri-plugin-process`, granted in
[`capabilities/default.json`](../apps/ai-engineering-hub/src-tauri/capabilities/default.json).
