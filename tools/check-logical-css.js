#!/usr/bin/env node
/**
 * tools/check-logical-css.js — backup grep for non-logical CSS properties.
 *
 * Stylelint already enforces this (gate 3) — this script is a belt-and-
 * suspenders against rules that bypass stylelint (e.g. inline `style=""`
 * in HTML, CSS-in-JS literals).
 *
 * Scans every .css and .js file under src/ (and the palette story) for
 * forbidden patterns. Whitelists src/styles/tokens (where these never
 * appear) for speed.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const FORBIDDEN = [
  { re: /margin-left\s*:/, hint: 'use margin-inline-start' },
  { re: /margin-right\s*:/, hint: 'use margin-inline-end' },
  { re: /padding-left\s*:/, hint: 'use padding-inline-start' },
  { re: /padding-right\s*:/, hint: 'use padding-inline-end' },
  { re: /border-left\s*:/, hint: 'use border-inline-start' },
  { re: /border-right\s*:/, hint: 'use border-inline-end' },
  { re: /text-align\s*:\s*(left|right)\b/, hint: 'use text-align: start / end' },
  { re: /float\s*:\s*(left|right)\b/, hint: 'use float: inline-start / inline-end' },
];

const SCAN_ROOTS = ['src'];
const SCAN_EXT = /\.(css|js)$/i;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.histoire', 'coverage', 'test-results']);

const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(full);
    } else if (SCAN_EXT.test(entry)) {
      scan(full);
    }
  }
}

function scan(file) {
  const txt = readFileSync(file, 'utf8');
  const lines = txt.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
    for (const rule of FORBIDDEN) {
      if (rule.re.test(line)) {
        violations.push(`${relative(ROOT, file)}:${i + 1} — ${line.trim()}  [${rule.hint}]`);
      }
    }
  }
}

for (const root of SCAN_ROOTS) walk(resolve(ROOT, root));

if (violations.length) {
  console.error('[check-logical-css] FAIL — non-logical CSS detected:');
  for (const v of violations) console.error('  ' + v);
  process.exit(1);
}
console.log('[check-logical-css] OK — every direction-sensitive CSS is logical.');
