#!/usr/bin/env node
/**
 * tools/check-manifest.js — ring lock-in invariant checker.
 *
 * Rules enforced:
 *  R2. No item in ring N+1 has status `draft` / `done` while ring N is
 *      not `locked-in`.
 *  R4. `dependsOn` graph is acyclic and references existing items.
 *
 * Exit 0 on success, 1 on any violation. Run in CI (see .github/workflows/ci.yml).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf8'));
const violations = [];

const ringNumbers = Object.keys(manifest.rings).map(Number).sort((a, b) => a - b);
const ringStatuses = Object.fromEntries(
  Object.entries(manifest.rings).map(([n, r]) => [Number(n), r.status]),
);

// R2 — ring dependency invariant.
for (const n of ringNumbers) {
  if (n === 0) continue;
  const prev = n - 1;
  const prevStatus = ringStatuses[prev];
  if (prevStatus === 'locked-in') continue;
  const items = manifest.items?.[`ring${n}`] || {};
  for (const [name, item] of Object.entries(items)) {
    if (item.status === 'draft' || item.status === 'done') {
      violations.push(
        `R2 violation: ring${n}/${name} is "${item.status}" while ring${prev} is "${prevStatus}" (must be "locked-in")`,
      );
    }
  }
}

// R4 — dependsOn cycle / unknown refs.
const allItemNames = new Set();
for (const n of ringNumbers) {
  for (const name of Object.keys(manifest.items?.[`ring${n}`] || {})) {
    allItemNames.add(name);
  }
}
const graph = new Map();
for (const n of ringNumbers) {
  for (const [name, item] of Object.entries(manifest.items?.[`ring${n}`] || {})) {
    const deps = item.dependsOn || [];
    graph.set(name, deps);
    for (const dep of deps) {
      // Token deps (e.g. "tokens:color") are first-class; they exist in
      // ring0 by definition.
      if (!allItemNames.has(dep) && !dep.startsWith('tokens:')) {
        violations.push(`R4 violation: ring${n}/${name} depends on unknown "${dep}"`);
      }
    }
  }
}
const WHITE = 0;
const GRAY = 1;
const BLACK = 2;
const colors = new Map();
function dfs(node, path = []) {
  if (colors.get(node) === GRAY) {
    violations.push(`R4 violation: dependsOn cycle: ${[...path, node].join(' → ')}`);
    return;
  }
  if (colors.get(node) === BLACK) return;
  colors.set(node, GRAY);
  for (const dep of graph.get(node) || []) {
    if (graph.has(dep)) dfs(dep, [...path, node]);
  }
  colors.set(node, BLACK);
}
for (const node of graph.keys()) {
  if ((colors.get(node) ?? WHITE) === WHITE) dfs(node);
}

if (violations.length) {
  console.error('[check-manifest] FAIL:\n  ' + violations.join('\n  '));
  process.exit(1);
}
console.log('[check-manifest] OK — all invariants hold.');
