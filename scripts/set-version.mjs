#!/usr/bin/env node
// Single source of truth for the project version. Updates every file that carries a
// version so they never drift. Usage:
//   node scripts/set-version.mjs 0.2.0
//
// Versioning policy: the leading `0.` is PERMANENT. A "major" change bumps the second
// segment (0.X.0); minor/patch bumps the third (0.x.Y). We never go to 1.x.x.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];

if (!version || !/^0\.\d+\.\d+$/.test(version)) {
  console.error(
    `✖ Invalid version: ${version ?? "(none)"}\n` +
      `  Expected 0.x.y — the leading "0." is permanent (a major change bumps the\n` +
      `  middle segment, e.g. 0.2.0). Usage: node scripts/set-version.mjs 0.2.0`,
  );
  process.exit(1);
}

// package.json files (root + every workspace package)
const pkgs = [
  "package.json",
  "apps/ai-engineering-hub/src/frontend/package.json",
  "apps/streamdeck-plugin/package.json",
  "packages/shared-types/package.json",
  "packages/shared-events/package.json",
  "packages/shared-api-contracts/package.json",
  "packages/shared-sdk/package.json",
  "packages/shared-design-tokens/package.json",
];

const changed = [];

for (const rel of pkgs) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  const json = JSON.parse(readFileSync(p, "utf8"));
  if (json.version !== version) {
    json.version = version;
    writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
    changed.push(rel);
  }
}

// Cargo workspace version ([workspace.package] version = "…")
{
  const p = join(root, "Cargo.toml");
  const toml = readFileSync(p, "utf8");
  const next = toml.replace(
    /(\[workspace\.package\][\s\S]*?\nversion\s*=\s*)"[^"]*"/,
    `$1"${version}"`,
  );
  if (next !== toml) {
    writeFileSync(p, next);
    changed.push("Cargo.toml");
  }
}

// Tauri config version
{
  const p = join(root, "apps/ai-engineering-hub/src-tauri/tauri.conf.json");
  const json = JSON.parse(readFileSync(p, "utf8"));
  if (json.version !== version) {
    json.version = version;
    writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
    changed.push("tauri.conf.json");
  }
}

// Stream Deck manifest — Elgato requires a 4-segment version (x.y.z.build)
{
  const p = join(
    root,
    "apps/streamdeck-plugin/com.aiengineering.monitor.sdPlugin/manifest.json",
  );
  const json = JSON.parse(readFileSync(p, "utf8"));
  const four = `${version}.0`;
  if (json.Version !== four) {
    json.Version = four;
    writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
    changed.push("manifest.json");
  }
}

if (changed.length === 0) {
  console.log(`✓ Already at ${version} — nothing to change.`);
} else {
  console.log(`✓ Set version ${version} in:\n  ${changed.join("\n  ")}`);
  console.log(`\nNext: commit, then tag — git tag v${version} && git push origin v${version}`);
}
