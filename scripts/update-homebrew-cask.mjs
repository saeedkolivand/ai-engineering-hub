#!/usr/bin/env node
/**
 * Updates Casks/ai-engineering-hub.rb with a new version and SHA256.
 * Called automatically by the release workflow after the macOS DMG is built.
 *
 * Usage: node scripts/update-homebrew-cask.mjs <version> <sha256>
 *   e.g. node scripts/update-homebrew-cask.mjs 0.1.3 a3f9c2...64hex
 */
import { readFileSync, writeFileSync } from "node:fs";

const [version, sha256] = process.argv.slice(2);
if (!version || !sha256) {
  console.error("Usage: update-homebrew-cask.mjs <version> <sha256>");
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid version: ${version} (expected x.y.z)`);
  process.exit(1);
}
if (!/^[a-f0-9]{64}$/.test(sha256)) {
  console.error(`Invalid SHA256: ${sha256} (expected 64 hex chars)`);
  process.exit(1);
}

const caskPath = "Casks/ai-engineering-hub.rb";
let content = readFileSync(caskPath, "utf8");

// Handles both a quoted sha256 and the :no_check placeholder
content = content.replace(/sha256 (?:"[^"]*"|:no_check)/, `sha256 "${sha256}"`);
content = content.replace(/version "[^"]+"/, `version "${version}"`);

writeFileSync(caskPath, content);
console.log(`✓ ${caskPath} → v${version} (${sha256.slice(0, 8)}…)`);
