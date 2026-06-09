#!/usr/bin/env node
/**
 * Assembles latest.json for the Tauri v2 updater from per-platform build artifacts.
 * Reads .sig files to get signatures; derives bundle URLs from the GitHub release.
 *
 * Usage: node scripts/make-update-manifest.mjs <tag> <artifacts-dir> <owner/repo>
 *   e.g. node scripts/make-update-manifest.mjs v0.2.0 ./artifacts saeedkolivand/ai-engineering-hub
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const [tag, artifactsDir, repo] = process.argv.slice(2);
if (!tag || !artifactsDir || !repo) {
  console.error("Usage: make-update-manifest.mjs <tag> <artifacts-dir> <owner/repo>");
  process.exit(1);
}

const version = tag.replace(/^v/, "");
const baseUrl = `https://github.com/${repo}/releases/download/${tag}`;

function walkSigFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkSigFiles(full));
    else if (entry.name.endsWith(".sig")) results.push(full);
  }
  return results;
}

function platformOf(filename) {
  const f = filename.toLowerCase();
  // macOS
  if (f.endsWith(".app.tar.gz.sig")) {
    if (f.includes("aarch64")) return "darwin-aarch64";
    if (f.includes("x86_64")) return "darwin-x86_64";
    return "darwin-aarch64";
  }
  // Linux — Tauri v2 (.AppImage.sig) and v1 (.AppImage.tar.gz.sig)
  if (f.endsWith(".appimage.tar.gz.sig") || f.endsWith(".appimage.sig")) return "linux-x86_64";
  // Windows — Tauri v2: .msi.sig / -setup.exe.sig; v1: .msi.zip.sig / .nsis.zip.sig
  if (f.endsWith(".msi.zip.sig") || f.endsWith(".msi.sig")) return "windows-x86_64-msi";
  if (f.endsWith(".nsis.zip.sig") || f.endsWith("-setup.exe.sig")) return "windows-x86_64";
  return null;
}

const platforms = {};
for (const sigFile of walkSigFiles(artifactsDir)) {
  const platform = platformOf(basename(sigFile));
  if (!platform) continue;
  const bundleName = basename(sigFile.slice(0, -4)); // strip .sig
  platforms[platform] = {
    signature: readFileSync(sigFile, "utf8").trim(),
    url: `${baseUrl}/${bundleName}`,
  };
}

if (Object.keys(platforms).length === 0) {
  console.error("No .sig files found — no updater platforms detected.");
  process.exit(1);
}

const manifest = {
  version,
  notes: `See https://github.com/${repo}/releases/tag/${tag} for details.`,
  pub_date: new Date().toISOString(),
  platforms,
};

writeFileSync("latest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`✓ latest.json for ${tag}: ${Object.keys(platforms).join(", ")}`);
