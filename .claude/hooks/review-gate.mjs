#!/usr/bin/env node
/**
 * review-gate.mjs — global Stop hook. Tiered, batched, token-efficient code review.
 * Generic by default; specialized per-project via <cwd>/.claude/review-routes.json + .claude/agents/*.md.
 * NEVER hard-fails the session: any error → exit 0 (don't block the user on a hook bug).
 *
 * Tiers: guards → skip-list → Tier 0 deterministic arch-guards → reviewed-hash cache →
 *        route to ≤3 owner checklists → ONE batched `claude -p` (model by risk) → block only on HIGH/CRITICAL.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

const exit0 = (msg) => {
  if (msg) process.stdout.write(msg);
  process.exit(0);
};
const block = (reason) => {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
};

try {
  // --- read Stop payload (stdin) ---
  let payload = {};
  if (!process.stdin.isTTY) {
    try {
      payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
    } catch {}
  }

  // 1. Guards (two distinct mechanisms)
  if (process.env.REVIEW_HOOK_ACTIVE) exit0(); // reviewer subprocess must never review itself (fork-bomb guard)
  if (payload.stop_hook_active === true) exit0(); // one review→fix cycle per finish-chain (block-once)

  const cwd = payload.cwd || process.cwd();
  const git = (args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

  // 2. git + changed files
  let inRepo = false;
  try {
    inRepo = git(['rev-parse', '--is-inside-work-tree']).trim() === 'true';
  } catch {}
  if (!inRepo) exit0();
  let changed = [];
  try {
    changed = git(['diff', '--name-only', 'HEAD'])
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {}
  try {
    changed = changed.concat(
      git(['ls-files', '--others', '--exclude-standard'])
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  } catch {}
  changed = [...new Set(changed)];
  if (!changed.length) exit0();

  // glob helpers
  const globToRe = (g) =>
    new RegExp(
      '^' +
        g
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*\*/g, ' ')
          .replace(/\*/g, '[^/]*')
          .replace(/ /g, '.*') +
        '$'
    );
  const matchesAny = (file, globs) => (globs || []).some((g) => globToRe(g).test(file));

  // 3. skip-list (no LLM)
  const SKIP = [
    'docs/**',
    'design/**',
    '**/*.md',
    '**/*.lock',
    '**/pnpm-lock.yaml',
    '**/package-lock.json',
    '**/Cargo.lock',
    '**/*.snap',
    '**/snapshots/**',
    '**/golden/**',
    '**/*.gen.*',
    '**/dist/**',
    '**/build/**',
    '**/target/**',
    'graphify-out/**',
  ];
  const nonSkipped = changed.filter((f) => !matchesAny(f, SKIP));
  if (!nonSkipped.length) exit0();

  // diff (bounded)
  let diff = '';
  try {
    diff = git(['diff', 'HEAD', '--unified=3', '--', ...nonSkipped]);
  } catch {}
  const MAX = 60000;
  if (diff.length > MAX) diff = diff.slice(0, MAX) + '\n...[diff truncated]...';

  // trivial-change heuristic (comment/import/blank-only → skip)
  const codeLines = diff.split('\n').filter((l) => /^[+-]/.test(l) && !/^[+-]{3}/.test(l));
  const meaningful = codeLines.filter((l) => {
    const b = l.slice(1).trim();
    if (!b) return false;
    if (/^(\/\/|\/\*|\*|#)/.test(b)) return false;
    if (/^(import |use |pub use |mod |from )/.test(b)) return false;
    return true;
  });
  if (!meaningful.length) exit0();

  // 4. Tier 0 — architecture guards (JS regex over changed .rs contents)
  // Hub rules: core/ = business logic (Axum/SQLx/ingestion/analytics); src-tauri/ = thin shell only.
  const archFindings = [];
  for (const f of nonSkipped) {
    if (!f.endsWith('.rs')) continue;
    let content = '';
    try {
      content = fs.readFileSync(path.join(cwd, f), 'utf8');
    } catch {
      continue;
    }
    const p = '/' + f;
    // env access must live in config modules only
    if (!/\/(config|platform)/.test(p) && /std::env::var\b/.test(content))
      archFindings.push(
        `HIGH · ${f} · std::env::var outside config module · move env access into core/src/config.rs or src-tauri/src/config.rs`
      );
    // HTTP client must live in server.rs or a dedicated http/net module
    if (!/\/(server|net|http)/.test(p) && /reqwest::Client\b/.test(content))
      archFindings.push(
        `HIGH · ${f} · reqwest::Client outside server/net module · use a shared HTTP client`
      );
    // typed errors everywhere
    if (!/\/(error|errors)(\.rs|\/)/.test(p) && /Result<[^>]*,\s*String\s*>/.test(content))
      archFindings.push(
        `HIGH · ${f} · untyped Result<_, String> · use typed AppError/AppResult`
      );
    // business logic must not live in src-tauri/src/ (thin shell rule)
    if (/apps\/ai-engineering-hub\/src-tauri\/src\//.test(p) &&
        !/\/(main|setup|commands)(\.rs|\/)/.test(p) &&
        content.length > 500)
      archFindings.push(
        `MEDIUM · ${f} · business logic in src-tauri shell · move to core/src/ (src-tauri must stay thin)`
      );
  }

  // 5. reviewed-hash cache
  const cachePath = path.join(cwd, '.claude', '.review-cache');
  let cache = new Set();
  try {
    cache = new Set(fs.readFileSync(cachePath, 'utf8').split('\n').filter(Boolean));
  } catch {}
  const hunkBodies = diff
    .split(/^@@.*$/m)
    .slice(1)
    .map((h) =>
      h
        .split('\n')
        .filter((l) => /^[+-]/.test(l) && !/^[+-]{3}/.test(l))
        .map((l) => l.slice(1).trim())
        .join('\n')
    );
  const hunkHashes = hunkBodies.map((b) => crypto.createHash('sha1').update(b).digest('hex'));
  if (hunkHashes.length && hunkHashes.every((h) => cache.has(h)) && !archFindings.length) exit0();

  // 6. route → ≤cap owners
  let routes = null;
  try {
    routes = JSON.parse(fs.readFileSync(path.join(cwd, '.claude', 'review-routes.json'), 'utf8'));
  } catch {}
  const cap = (routes && routes.cap) || 3;
  const owners = [];
  if (routes && routes.primary)
    for (const f of nonSkipped) {
      const r = routes.primary.find((rt) => globToRe(rt.glob).test(f));
      if (r && !owners.includes(r.owner)) owners.push(r.owner);
    }
  const secondaries = [];
  if (routes && routes.secondary)
    for (const s of routes.secondary) {
      if (nonSkipped.some((f) => matchesAny(f, s.globs)) && !owners.includes(s.owner))
        secondaries.push(s.owner);
    }
  let selected = owners.slice(0, cap);
  for (const s of secondaries) {
    if (selected.length >= cap) break;
    if (!selected.includes(s)) selected.push(s);
  }
  if (!selected.length) selected = ['rust-backend-architect'];

  // model by risk
  const highRisk = selected.includes('tauri-security-reviewer') || selected.includes('contracts-architect');
  const model = highRisk ? 'sonnet' : 'haiku';

  // owner checklists
  const agentDir = path.join(cwd, '.claude', 'agents');
  const checklists = selected
    .map((name) => {
      try {
        const c = fs
          .readFileSync(path.join(agentDir, name + '.md'), 'utf8')
          .replace(/^---[\s\S]*?---/, '')
          .trim();
        return `### ${name}\n${c.slice(0, 1600)}`;
      } catch {
        return `### ${name}`;
      }
    })
    .join('\n\n');

  // lessons retrieval
  let lessons = '';
  try {
    const lp = path.join(cwd, '.claude', 'hooks', 'lessons.mjs');
    if (fs.existsSync(lp) && routes && routes.lessons_domains) {
      const domains = Object.keys(routes.lessons_domains).filter((d) =>
        nonSkipped.some((f) => matchesAny(f, routes.lessons_domains[d]))
      );
      const out = [];
      for (const d of domains.slice(0, 3)) {
        const r = spawnSync(process.execPath, [lp, 'query', '--domain', d, '--limit', '4'], {
          cwd,
          encoding: 'utf8',
        });
        if (r.stdout && r.stdout.trim()) out.push(r.stdout.trim());
      }
      if (out.length)
        lessons = '\n\n## Relevant prior lessons (consult, do not just repeat)\n' + out.join('\n');
    }
  } catch {}

  // 7. ONE batched claude -p
  const prompt = `You are a STRICT but calibrated code reviewer. Review ONLY the diff below, applying the relevant reviewer checklists. Use the severity rubric EXACTLY. Output ONLY findings, one per line, as: \`SEVERITY · file:line · finding · one-line fix\` (SEVERITY ∈ LOW|MEDIUM|HIGH|CRITICAL). If there are no HIGH/CRITICAL issues, reply with exactly: APPROVED (optionally followed by LOW/MEDIUM advisory lines).

## Severity rubric
- CRITICAL: exploitable security on a secret/credential/IPC/updater/network-egress path; data loss/corruption; breaks a release or CI gate.
- HIGH: architecture-rule violation (business logic in src-tauri shell, std::env::var outside config, reqwest::Client outside net/server, untyped Result<_,String>); TS/Rust contract parity broken; plugin accesses SQLite or computes analytics directly; untested error/security path on changed code.
- MEDIUM: missing edge-case test, weak assertion, unguarded hot-path perf regression, non-blocking correctness smell.
- LOW: style/naming/comments/formatting/docs.
Tie-break to the LOWER level, except security/data → HIGHER. Only HIGH/CRITICAL are blocking.

## Reviewer checklists (apply only those whose area the diff touches)
${checklists}${lessons}

## Diff
\`\`\`diff
${diff}
\`\`\`
`;
  let reviewOut = '';
  try {
    const r = spawnSync('claude', ['-p', '--model', model, '--output-format', 'text'], {
      cwd,
      input: prompt,
      encoding: 'utf8',
      shell: true,
      env: { ...process.env, REVIEW_HOOK_ACTIVE: '1' },
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });
    reviewOut = (r.stdout || '').trim();
  } catch {}

  // 8. aggregate + decide
  const llmFindings =
    reviewOut && !/^APPROVED/i.test(reviewOut)
      ? reviewOut
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const all = [...archFindings, ...llmFindings];
  const blocking = all.filter((l) => /\b(HIGH|CRITICAL)\b/.test(l));
  const lowmed = llmFindings.filter((l) => !/\b(HIGH|CRITICAL)\b/.test(l) && !/^APPROVED/i.test(l));

  // advisories
  const advisory = [];
  if (routes && routes.advisory) {
    if (nonSkipped.some((f) => matchesAny(f, routes.advisory.docs_stale)))
      advisory.push('docs may be stale → run /update-docs');
    if (nonSkipped.some((f) => matchesAny(f, routes.advisory.release)))
      advisory.push('release config changed → run /prepare-release');
    if (nonSkipped.some((f) => matchesAny(f, routes.advisory.contracts_parity)))
      advisory.push('shared contract changed — verify TS/Rust mirrors are in parity → run /review-contracts');
  }
  const testable = nonSkipped.some(
    (f) => /\.(rs|ts|tsx)$/.test(f) && !/\.(test|spec)\./.test(f) && !/\.d\.ts$/.test(f)
  );
  const testChanged = changed.some(
    (f) => /\.(test|spec)\./.test(f) || /\/tests\//.test(f) || /\/e2e\//.test(f)
  );
  if (testable && !testChanged)
    advisory.push('changed logic without accompanying tests → consider /add-tests');

  // record reviewed hunks
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.appendFileSync(cachePath, hunkHashes.join('\n') + '\n');
  } catch {}

  if (blocking.length) {
    block(
      `Review gate [${selected.join(', ')}] — blocking issues, address then finish:\n\n${blocking.join('\n')}` +
        (advisory.length ? `\n\nAdvisory:\n- ${advisory.join('\n- ')}` : '')
    );
  }
  if (lowmed.length || advisory.length) {
    let note = '✓ Review gate: no blocking issues.';
    if (lowmed.length) note += `\nAdvisory findings:\n${lowmed.join('\n')}`;
    if (advisory.length) note += `\nReminders:\n- ${advisory.join('\n- ')}`;
    exit0(note);
  }
  exit0();
} catch {
  process.exit(0);
}
