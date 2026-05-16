#!/usr/bin/env node
/**
 * tools/check-composition.js — primitive composition contract gate.
 *
 * Enforces ADR-0058: a component template MUST consume any other kit
 * component via {% include %} / {% embed %} — never by reproducing that
 * component's ROOT class inline.
 *
 * Detection model:
 *  - Each component dir <c> under src/templates/components/ owns the
 *    root class `theme-<c>` / `theme-page-<c>` (+ modifier `--x`).
 *  - A ROOT class token (`theme-<c>` or `theme-<c>--mod`) of component A
 *    found in a `class="…"` attribute of component B (A !== B) is an
 *    inline reproduction → violation.
 *  - BEM CHILD tokens (`theme-<c>__child`) are NOT flagged: reusing a
 *    child class is CSS-contract reuse (e.g. a shared controller's DOM
 *    hook `theme-popover__content`), not reproduction of the component.
 *  - Twig `{# #}` and HTML `<!-- -->` comments are stripped before scan
 *    (doc-comment usage examples are not code).
 *  - Whole-token matching: `theme-button-group` is its own token, never
 *    confused with `theme-button`.
 *
 * Transitional baseline (ADR-0058 §2): tools/check-composition.allow.txt
 *  - one repo-relative path per line (`#` comments allowed);
 *  - violation in a baselined file → notice; in a fresh file → FAIL;
 *  - baselined file now clean → FAIL ("stale — remove it"): shrink-only.
 *
 * Usage:
 *  node tools/check-composition.js                   # the gate (CI)
 *  node tools/check-composition.js --write-baseline  # one-time bootstrap
 *
 * Exit 0 on success, 1 on any hard violation. Ran in CI per .gitlab-ci.yml.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, relative, sep } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = resolve(ROOT, 'src/templates/components');
const TEMPLATES_DIR = resolve(ROOT, 'src/templates');
const BASELINE_FILE = resolve(ROOT, 'tools/check-composition.allow.txt');
const writeBaseline = process.argv.includes('--write-baseline');

// --- owned-root → component map -------------------------------------------
const componentDirs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const rootToComponent = new Map();
for (const c of componentDirs) {
  const slug = c.replace(/^_/, ''); // `_auth-shell` → `auth-shell`
  for (const root of [`theme-${c}`, `theme-${slug}`, `theme-page-${slug}`]) {
    rootToComponent.set(root, c);
  }
}

// --- templates -------------------------------------------------------------
const twigFiles = readdirSync(TEMPLATES_DIR, { recursive: true })
  .filter((f) => typeof f === 'string' && f.endsWith('.html.twig'))
  .map((f) => resolve(TEMPLATES_DIR, f));

function ownerOf(absPath) {
  const rel = relative(COMPONENTS_DIR, absPath);
  return rel.startsWith('..') ? null : rel.split(sep)[0];
}

// Blank out comment bodies, keeping newlines so line numbers stay exact.
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return src.replace(/\{#[\s\S]*?#\}/g, blank).replace(/<!--[\s\S]*?-->/g, blank);
}

// A class token maps to a component only when it is that component's
// ROOT (optionally + `--modifier`). BEM children (`__x`) never match —
// reusing a child class is CSS-contract reuse, not reproduction.
function componentOf(token) {
  if (token.includes('__')) return null;
  const root = token.includes('--') ? token.slice(0, token.indexOf('--')) : token;
  return rootToComponent.get(root) ?? null;
}

const CLASS_ATTR = /class\s*=\s*("([^"]*)"|'([^']*)')/g;
const CLASS_TOKEN =
  /theme-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?/g;

// --- baseline --------------------------------------------------------------
const baseline =
  !writeBaseline && existsSync(BASELINE_FILE)
    ? new Set(
        readFileSync(BASELINE_FILE, 'utf8')
          .split('\n')
          .map((l) => l.replace(/#.*$/, '').trim())
          .filter(Boolean),
      )
    : new Set();

// --- scan ------------------------------------------------------------------
const hard = [];
const baselinedFiles = new Set();

for (const file of twigFiles) {
  const owner = ownerOf(file);
  const relPath = relative(ROOT, file).split(sep).join('/');
  const src = stripComments(readFileSync(file, 'utf8'));

  let attr;
  CLASS_ATTR.lastIndex = 0;
  while ((attr = CLASS_ATTR.exec(src)) !== null) {
    const value = attr[2] ?? attr[3] ?? '';
    const tokens = value.match(CLASS_TOKEN);
    if (!tokens) continue;
    let line = 0;
    for (const token of tokens) {
      const comp = componentOf(token);
      if (!comp || comp === owner) continue; // utility / BEM child / own component
      if (baseline.has(relPath)) {
        baselinedFiles.add(relPath);
      } else {
        if (!line) line = src.slice(0, attr.index).split('\n').length;
        hard.push(
          `${relPath}:${line} — inline '${token}' reproduces '${comp}' — use {% include '@theme/components/${comp}/${comp}.html.twig' %}`,
        );
      }
    }
  }
}

// --- --write-baseline mode (one-time bootstrap) ----------------------------
if (writeBaseline) {
  const files = [...new Set(hard.map((v) => v.split(' — ')[0].replace(/:\d+$/, '')))].sort();
  const header =
    '# check-composition.allow.txt — ADR-0058 transitional baseline.\n' +
    '# Files with pre-existing inline-reproduction violations, grandfathered\n' +
    '# until remediated. This list can only SHRINK; delete the file when empty.\n' +
    '# Bootstrap only: node tools/check-composition.js --write-baseline\n';
  writeFileSync(BASELINE_FILE, header + files.join('\n') + '\n');
  console.log(
    `[check-composition] baseline written — ${files.length} file(s) → ${relative(ROOT, BASELINE_FILE)}`,
  );
  process.exit(0);
}

// --- report ----------------------------------------------------------------
const stale = [...baseline].filter((p) => !baselinedFiles.has(p));
let failed = false;

if (hard.length) {
  failed = true;
  const byFile = new Map();
  for (const v of hard) {
    const f = v.split(' — ')[0].replace(/:\d+$/, '');
    byFile.set(f, (byFile.get(f) || 0) + 1);
  }
  console.error(
    `[check-composition] FAIL — ${hard.length} inline reproduction(s) in ${byFile.size} non-baselined file(s).\n`,
  );
  console.error('  ── per file ──');
  for (const [f, n] of [...byFile].sort()) console.error(`  ${String(n).padStart(3)}  ${f}`);
  console.error('\n  ── detail ──');
  for (const v of hard) console.error('  ' + v);
}

if (stale.length) {
  failed = true;
  console.error(
    `\n[check-composition] FAIL — ${stale.length} baseline entr(y/ies) now clean — remove from tools/check-composition.allow.txt:\n  ` +
      stale.join('\n  '),
  );
}

if (!failed) {
  console.log(
    baseline.size
      ? `[check-composition] OK — no new violations. ${baseline.size} file(s) still in the ADR-0058 transitional baseline.`
      : '[check-composition] OK — composition contract clean, kit-wide.',
  );
}

process.exit(failed ? 1 : 0);
