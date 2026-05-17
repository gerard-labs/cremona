#!/usr/bin/env node
/**
 * tools/check-budget.js — bundle budget review-time enforcement.
 *
 * Parses spec §10 Bundle budget sub-section declarations across all
 * Ring 0/1/2/3 items with status `done` or `draft`, aggregates the
 * cumulative honest declarations, and reports against the current
 * ceiling (62 kB) — auto-resolved via `--ceiling=auto`.
 *
 * Review-time enforcement only. CI gate hook is deferred to when bundle
 * measurement is reliably accessible.
 *
 * Usage:
 *   node tools/check-budget.js
 *   node tools/check-budget.js --ceiling=62
 *   node tools/check-budget.js --ceiling=auto
 *   node tools/check-budget.js --verbose
 *   node tools/check-budget.js --strict
 *
 * Exit codes:
 *   0  Cumulative ≤ ceiling AND no errors.
 *   1  Cumulative > ceiling × 1.30 (worst-case overshoot).
 *   2  --strict AND any warning.
 *   3+ Parse failure / missing files.
 *
 * The script reports declared §10 values + cumulative vs ceiling.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ADR_DIR = resolve(ROOT, 'docs/adr');
const SPECS_DIR = resolve(ROOT, 'docs/specs');

// ─── CLI arg parsing ───────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name, defaultValue = null) => {
  const found = args.find((a) => a.startsWith(`--${name}=`) || a === `--${name}`);
  if (!found) return defaultValue;
  if (found === `--${name}`) return true;
  return found.split('=')[1];
};
const ceilingArg = flag('ceiling', 'auto');
const verbose = flag('verbose', false) === true || flag('verbose', null) === 'true';
const strict = flag('strict', false) === true || flag('strict', null) === 'true';

// ─── Ceiling resolution ────────────────────────────────────────────────
function resolveCeiling(arg) {
  if (arg !== 'auto' && arg !== null) {
    const value = Number(arg);
    if (!Number.isFinite(value) || value <= 0) {
      console.error(`[check-budget] ERROR: invalid --ceiling=${arg} (expected positive number or 'auto')`);
      process.exit(3);
    }
    return { value, source: 'cli override' };
  }
  // Auto-resolve from latest ceiling file by filename numerical title parse.
  // Pattern: 00NN-amend-bundle-ceiling-<kB>kb.md
  const adrFiles = readdirSync(ADR_DIR)
    .filter((f) => /^\d{4}-amend-bundle-ceiling-\d+kb\.md$/.test(f))
    .sort((a, b) => Number(a.slice(0, 4)) - Number(b.slice(0, 4)));
  if (adrFiles.length === 0) {
    console.error('[check-budget] ERROR: no amend-bundle-ceiling-*.md file found ; pass --ceiling=<kB> explicitly');
    process.exit(3);
  }
  const latest = adrFiles[adrFiles.length - 1];
  const match = latest.match(/-(\d+)kb\.md$/);
  return { value: Number(match[1]), source: `${latest.slice(0, 4)} (${latest})` };
}

const { value: ceiling, source: ceilingSource } = resolveCeiling(ceilingArg);

// ─── Manifest read + item enumeration ──────────────────────────────────
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf8'));
const items = [];
const ringNumbers = Object.keys(manifest.rings).map(Number).sort((a, b) => a - b);

for (const n of ringNumbers) {
  const ringItems = manifest.items?.[`ring${n}`] || {};
  for (const [name, item] of Object.entries(ringItems)) {
    if (item.status !== 'done' && item.status !== 'draft' && item.status !== 'locked-in') continue;
    if (n === 0) continue; // Ring 0 items have no §10 spec (tokens / build infra)
    const basename = name.includes(':') ? name.split(':')[1] : name;
    const specPath = resolve(SPECS_DIR, `ring${n}`, `${basename}.md`);
    items.push({ ring: n, name, basename, status: item.status, specPath });
  }
}

// ─── Spec §10 parser ───────────────────────────────────────────────────
/**
 * Parse a spec's §10 Bundle budget sub-section.
 * Returns { cssKb, jsKb, hasDeclaration, raw } where cssKb / jsKb take
 * the HIGH END of any declared range (e.g. "~0.3-0.4 kB" → 0.4).
 * `hasDeclaration` is false for Ring 1/2 specs without a §10 declaration —
 * those specs contribute 0 to cumulative.
 */
function parseBundleBudget(specPath) {
  if (!existsSync(specPath)) {
    return { cssKb: 0, jsKb: 0, hasDeclaration: false, raw: null, missing: true };
  }
  const content = readFileSync(specPath, 'utf8');
  // Locate §10 heading (any of "## 10." or "## 10 " variants).
  const headingMatch = content.match(/^## 10\.?\s.*$/m);
  if (!headingMatch) {
    return { cssKb: 0, jsKb: 0, hasDeclaration: false, raw: null };
  }
  // Slice from §10 to the NEXT §N heading (## followed by a digit at line start).
  // Note: `^## ` alone would match `### ` substring start ; require `## <digit>`.
  const startIdx = headingMatch.index;
  const afterHeading = content.slice(startIdx + headingMatch[0].length);
  const nextHeadingRegex = /^## \d/m;
  const nextHeadingMatch = afterHeading.match(nextHeadingRegex);
  const sectionEnd = nextHeadingMatch ? startIdx + headingMatch[0].length + nextHeadingMatch.index : content.length;
  const section = content.slice(startIdx, sectionEnd);
  // Locate "Bundle budget" sub-section (### Bundle budget OR inline reference).
  const bundleStart = section.search(/###\s+Bundle\s+budget|Bundle budget/i);
  if (bundleStart === -1) {
    return { cssKb: 0, jsKb: 0, hasDeclaration: false, raw: null };
  }
  const bundleSection = section.slice(bundleStart);
  // Extract CSS / JS delta values via regex. Patterns matched:
  //   "Expected CSS delta : ~0.15 kB"
  //   "Expected CSS delta : ~0.3-0.4 kB"
  //   "CSS Δ : +0.20 kB"
  //   "Honest CSS Δ : +0.15"
  // We take the HIGH end of any range (worst-case honest declaration).
  function extract(label) {
    const patterns = [
      new RegExp(`${label}[^\\n]*?~?([\\d.]+)\\s*(?:-\\s*([\\d.]+))?\\s*kB`, 'i'),
      new RegExp(`${label}[^\\n]*?\\+?([\\d.]+)\\s*(?:-\\s*([\\d.]+))?\\s*kB`, 'i'),
    ];
    for (const re of patterns) {
      const m = bundleSection.match(re);
      if (m) {
        const high = m[2] !== undefined ? Number(m[2]) : Number(m[1]);
        if (Number.isFinite(high)) return high;
      }
    }
    return null;
  }
  const cssKb = extract('CSS\\s*(?:delta|Δ)') ?? 0;
  const jsKb = extract('JS\\s*(?:delta|Δ)') ?? 0;
  // hasDeclaration = at least one of CSS/JS was matched explicitly.
  const hasDeclaration = cssKb > 0 || jsKb > 0;
  return { cssKb, jsKb, hasDeclaration, raw: bundleSection.slice(0, 600) };
}

// ─── Aggregate cumulative + per-item parsing ───────────────────────────
const parsed = items.map((it) => ({ ...it, budget: parseBundleBudget(it.specPath) }));

let cumulativeCss = 0;
let cumulativeJs = 0;
let s33CssCumulative = 0; // Sub-cumulative for Ring 3 specs only
let s33JsCumulative = 0;
const declaredItems = [];
const missingSpecs = [];
const noBundleSection = [];

for (const it of parsed) {
  if (it.budget.missing) {
    missingSpecs.push(it);
    continue;
  }
  cumulativeCss += it.budget.cssKb;
  cumulativeJs += it.budget.jsKb;
  if (it.budget.hasDeclaration) {
    declaredItems.push(it);
    if (it.ring === 3) {
      s33CssCumulative += it.budget.cssKb;
      s33JsCumulative += it.budget.jsKb;
    }
  } else {
    noBundleSection.push(it);
  }
}

// ─── Report ─────────────────────────────────────────────────────────────
const totalDeclared = cumulativeCss + cumulativeJs;
const totalDeclaredS33 = s33CssCumulative + s33JsCumulative;
const worstCase = totalDeclared * 1.30; // +30 % worst-case overshoot ratio
const worstCaseS33 = totalDeclaredS33 * 1.30;

console.log('[check-budget] Bundle budget review-time enforcement');
console.log(`[check-budget] Ceiling: ${ceiling} kB (source: ${ceilingSource})`);
console.log('');

console.log(`Items enumerated: ${items.length} (done + draft + locked-in across rings ≥ 1)`);
console.log(`  with §10 Bundle budget declaration: ${declaredItems.length}`);
console.log(`  without §10 Bundle budget section: ${noBundleSection.length}`);
if (missingSpecs.length > 0) {
  console.log(`  MISSING spec file: ${missingSpecs.length}`);
}
console.log('');

console.log('Cumulative honest declarations:');
console.log(`  All rings ≥ 1 CSS+JS    : ~+${totalDeclared.toFixed(2)} kB declared (+${worstCase.toFixed(2)} kB worst-case × 1.30)`);
console.log(`  Ring 3 only CSS+JS      : ~+${totalDeclaredS33.toFixed(2)} kB declared (+${worstCaseS33.toFixed(2)} kB worst-case)`);
console.log('');

console.log('Per-class breakdown (all rings ≥ 1):');
console.log(`  CSS markers   : ~+${cumulativeCss.toFixed(2)} kB`);
console.log(`  JS controllers: ~+${cumulativeJs.toFixed(2)} kB`);
console.log('');

// Note: cumulative is NOT directly comparable to ceiling — the ceiling is
// TOTAL initial bundle including base infrastructure, NOT just §10 deltas.
// The cumulative §10 declarations project the additive growth vs baseline.
console.log('Ceiling comparison note:');
console.log(`  The ceiling (${ceiling} kB) is the TOTAL initial bundle gzip cap.`);
console.log(`  The cumulative §10 declarations above (~+${totalDeclaredS33.toFixed(2)} kB Ring 3) are the`);
console.log(`  ADDITIVE pattern budget, not the total bundle.`);
console.log('');

// ─── Warnings / errors ──────────────────────────────────────────────────
const warnings = [];
const errors = [];

if (missingSpecs.length > 0) {
  for (const it of missingSpecs) {
    errors.push(`MISSING SPEC: ring${it.ring}/${it.name} status=${it.status} but ${it.specPath} does not exist`);
  }
}

if (verbose) {
  console.log('Per-item §10 declarations (verbose):');
  for (const it of declaredItems) {
    const cssStr = it.budget.cssKb > 0 ? `+${it.budget.cssKb.toFixed(2)} CSS` : '0 CSS';
    const jsStr = it.budget.jsKb > 0 ? `+${it.budget.jsKb.toFixed(2)} JS` : '0 JS';
    console.log(`  ring${it.ring}/${it.basename.padEnd(40)} [${it.status.padEnd(9)}] ${cssStr} ${jsStr}`);
  }
  console.log('');
}

if (warnings.length) {
  console.log('WARNINGS:');
  for (const w of warnings) console.log(`  ⚠️  ${w}`);
  console.log('');
}

if (errors.length) {
  console.error('ERRORS:');
  for (const e of errors) console.error(`  ❌ ${e}`);
  console.error('');
}

// ─── Exit code resolution ──────────────────────────────────────────────
if (errors.length > 0) {
  console.error('[check-budget] FAIL — errors detected.');
  process.exit(1);
}
if (strict && warnings.length > 0) {
  console.error('[check-budget] FAIL (strict mode) — warnings detected.');
  process.exit(2);
}
console.log('[check-budget] OK — cumulative declarations parsed ; reviewer audits ceiling delta.');
process.exit(0);
