#!/usr/bin/env node
/**
 * tools/check-i18n.js — locale parity + template hardcoded-string detection.
 *
 * Rules enforced:
 *  H1. fr.json exists and is the reference locale (per ADR-0006).
 *  H2. Every other locale defines exactly the same key set as fr.json.
 *      Missing or extra keys block CI.
 *  H3. No hardcoded user-facing strings in templates. Scans:
 *       - src/**\/*.html.twig  — text outside {{ … }}, {% … %}, {# … #};
 *                                user-facing attrs (aria-label, title,
 *                                placeholder, alt, …) must carry a
 *                                {{ t('theme.…') }} expression.
 *       - src/**\/*.story.vue — template literals inside <script setup>
 *                                only (the Histoire <template> section is
 *                                catalog metadata, never user-facing).
 *                                Text outside ${…} interpolation must use
 *                                ${t('theme.…')}.
 *       - src/**\/*.story.js  — same logic, programmatic story pattern.
 *
 *  H3 added in Ring 1 S1.1 per OQ-3 in STATE.md (the first `.html.twig`
 *  template lands this session — see Typography primitive).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const I18N_DIR = resolve(ROOT, 'src/js/i18n');
const TEMPLATE_DIR = resolve(ROOT, 'src');
const REF_LOCALE = 'fr';

const violations = [];

// ----- H1 + H2 : locale parity (unchanged from Ring 0) -----------------
const refPath = join(I18N_DIR, `${REF_LOCALE}.json`);
const refDict = JSON.parse(readFileSync(refPath, 'utf8'));
const refKeys = new Set(Object.keys(refDict));

const localeFiles = readdirSync(I18N_DIR).filter((f) => f.endsWith('.json') && f !== `${REF_LOCALE}.json`);
for (const file of localeFiles) {
  const dict = JSON.parse(readFileSync(join(I18N_DIR, file), 'utf8'));
  const keys = new Set(Object.keys(dict));
  for (const k of refKeys) {
    if (!keys.has(k)) violations.push(`H2 violation: ${file} missing key "${k}"`);
  }
  for (const k of keys) {
    if (!refKeys.has(k)) violations.push(`H2 violation: ${file} has extra key "${k}" (not in ${REF_LOCALE}.json)`);
  }
}

// ----- H3 : hardcoded-string detection in templates --------------------
const TWIG_RE = /\.html\.twig$/;
const STORY_VUE_RE = /\.story\.vue$/;
const STORY_JS_RE = /\.story\.js$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.histoire', 'coverage', 'test-results']);

// Attribs that carry user-facing strings — values must use t() / {{ }}.
const USER_FACING_ATTRS = ['aria-label', 'aria-description', 'aria-roledescription', 'aria-placeholder', 'placeholder', 'title', 'alt'];

// Allowlist for raw tokens that legitimately appear as text inside
// templates without needing t(). Strict — update sparingly + document.
const ALLOWLIST = new Set([
  // File / media format tokens
  'svg', 'png', 'jpg', 'gif', 'webp', 'mp4', 'webm',
  // CSS / JS literals
  'true', 'false', 'null', 'auto', 'none', 'inherit', 'initial', 'currentcolor',
  // Direction / unit tokens
  'rtl', 'ltr', 'px', 'em', 'rem', 'vh', 'vw',
  // Brand (only the bare brand name — actual screen copy still goes through t())
  'gerard',
]);

// Sentinel used to mask ${…} interpolation in template literals so the
// HTML tokenizer regex doesn't get confused by `${` characters.
const INTERP_SENTINEL = '';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function isInsignificantText(text, { allowTypographySamples = false } = {}) {
  const t = text.trim();
  if (t.length < 2) return true;
  if (/^[\p{P}\p{N}\p{S}\s]+$/u.test(t)) return true;
  if (ALLOWLIST.has(t.toLowerCase())) return true;
  if (allowTypographySamples) {
    // Typography sample heuristic — every space-separated "word" is short
    // letters (≤3 chars), pure digits, or pure punctuation. Catches the
    // canonical "Aa Bb 0123" demo without letting real prose slip through.
    const words = t.split(/\s+/);
    if (
      words.every((w) =>
        /^[\p{P}\p{S}]+$/u.test(w) ||
        /^\p{N}+$/u.test(w) ||
        /^[\p{L}]{1,3}$/u.test(w),
      )
    ) {
      return true;
    }
  }
  return false;
}

function lineOfOffset(src, offset) {
  return src.slice(0, offset).split('\n').length;
}

function scanAttrs(src, file, scope = src) {
  for (const attr of USER_FACING_ATTRS) {
    const re = new RegExp(`\\b${attr}=(?:"([^"]+)"|'([^']+)')`, 'g');
    let m;
    while ((m = re.exec(scope))) {
      const value = m[1] || m[2];
      // Skip if value carries a Twig / Vue interpolation.
      if (/\{\{[\s\S]*?\}\}/.test(value)) continue;
      // Skip if value is a single JS interpolation (entire value is ${…}).
      if (/^\$\{[\s\S]*?\}$/.test(value)) continue;
      // Skip if value is an obvious technical token.
      if (isInsignificantText(value)) continue;
      const offset = (scope === src) ? m.index : src.indexOf(scope) + m.index;
      const line = lineOfOffset(src, offset >= 0 ? offset : m.index);
      violations.push(`H3 violation: ${file}:${line} — hardcoded ${attr}="${value}" — wrap value in {{ t('theme.…') }} (Twig) or \${t('theme.…')} (story)`);
    }
  }
}

function scanTwig(file, src) {
  // Strip Twig blocks + HTML attribute values so neither `{{ }}` nor
  // `>` characters trapped inside `data-action="error->fn"` confuse
  // the text-content regex. Preserve newlines so `m.index` line lookup
  // stays in sync with the original source.
  //
  // Two passes :
  //   1. blocksStripped : Twig {{ }} / {% %} / {# #} blocks blanked.
  //      Used for the attribute scan so user-facing attrs INSIDE a Twig
  //      doc comment (e.g. `aria-roledescription="example"` quoted inside
  //      a {#- ... -#} block) don't trigger H3 — comments are not
  //      user-facing per the invariant.
  //   2. stripped : blocksStripped + attribute values blanked.
  //      Used for the text-content scan so `>` inside an attribute value
  //      doesn't get mistaken for end-of-tag.
  //
  // Length-preserving so m.index line lookup stays aligned with the
  // original source.
  //
  // The "scan attrs through blocksStripped" branch was tightened in S3.1
  // opening — pre-S3.1 file-upload.html.twig had an `aria-roledescription
  // ="zone de téléversement"` quoted example inside its {#- ... -#} doc
  // block and `scanAttrs(src, ...)` (un-stripped) flagged it as H3. Twig
  // comments are doc, not user-facing — the tool now matches the
  // invariant's intent. Precedent S1.1 (the H3 invariant itself landed
  // without ADR — pure tool tweak).
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  const blocksStripped = src
    .replace(/\{\{[\s\S]*?\}\}/g, blank)
    .replace(/\{%[\s\S]*?%\}/g, blank)
    .replace(/\{#[\s\S]*?#\}/g, blank);
  const stripped = blocksStripped
    .replace(/="[^"]*"/g, blank)
    .replace(/='[^']*'/g, blank);
  const re = />([^<]+)</g;
  let m;
  while ((m = re.exec(stripped))) {
    const text = m[1].trim();
    if (isInsignificantText(text, { allowTypographySamples: true })) continue;
    const line = lineOfOffset(src, m.index);
    violations.push(`H3 violation: ${file}:${line} — possible hardcoded text "${text}" — wrap in {{ t('theme.…') }}`);
  }
  scanAttrs(src, file, blocksStripped);
}

function scanStoryScriptSetup(file, src) {
  // Extract <script setup> body — we only scan there. The <template>
  // section is Histoire catalog metadata (<Story>, <Variant> attrs),
  // not user-facing.
  const scriptMatch = src.match(/<script setup>([\s\S]*?)<\/script>/);
  if (!scriptMatch) return;
  const scriptBody = scriptMatch[1];
  const scriptStart = src.indexOf(scriptBody);
  scanTemplateLiterals(file, src, scriptBody, scriptStart);
}

function scanStoryJs(file, src) {
  // Whole file is JS — scan all template literals.
  scanTemplateLiterals(file, src, src, 0);
}

function scanTemplateLiterals(file, src, body, bodyOffset) {
  // Crude but effective: a non-greedy backtick pair. Doesn't handle
  // escaped backticks or nested template literals — acceptable for the
  // SFC + v-html pattern locked in ADR-0006.
  const litRe = /`([\s\S]*?)`/g;
  let m;
  while ((m = litRe.exec(body))) {
    const lit = m[1];
    // Two-step masking, same scheme as scanTwig:
    //   1. Brace-balanced ${ … } interpolation masker so JS expressions
    //      with nested braces (.map().join()) don't confuse the scan.
    //   2. HTML attribute-value masker (both " and ' quoting) so a `>`
    //      inside an attribute value — typical of Stimulus actions like
    //      `data-action="click->controller#method"` — isn't mistaken for
    //      end-of-tag. Mirrors the OQ-3 attr-value masker in scanTwig.
    //      Length-preserving so the post-masking line counts stay aligned.
    const masked = maskAttrs(maskInterpolations(lit));
    const tagRe = />([^<]+)</g;
    let tm;
    while ((tm = tagRe.exec(masked))) {
      const raw = tm[1];
      const withoutInterp = raw.replace(new RegExp(INTERP_SENTINEL, 'g'), '').trim();
      if (!withoutInterp) continue;
      if (isInsignificantText(withoutInterp, { allowTypographySamples: true })) continue;
      const litStartLine = lineOfOffset(src, bodyOffset + m.index);
      const within = lit.slice(0, tm.index).split('\n').length - 1;
      const line = litStartLine + within;
      violations.push(`H3 violation: ${file}:${line} — possible hardcoded text "${withoutInterp}" in story literal — wrap in \${t('theme.…')}`);
    }
  }
}

/**
 * Walks the template literal one char at a time, replacing each
 * balanced `${…}` block with a single sentinel. Handles nested braces
 * inside the JS expression. Does NOT handle string literals containing
 * unmatched braces inside the interpolation (acceptable — we never write
 * such things in our stories).
 */
/**
 * Replace every HTML attribute value (both " and ' quoting) with spaces of
 * the same length, so a `>` inside an attribute (e.g. Stimulus's
 * `data-action="event->controller#method"`) doesn't get mistaken for
 * end-of-tag by the subsequent `>([^<]+)<` text-content scan.
 *
 * Length-preserving so post-masking offsets stay aligned with the original
 * literal — line-number computation downstream relies on that.
 */
function maskAttrs(s) {
  return s
    .replace(/="[^"]*"/g, (m) => `="${' '.repeat(m.length - 3)}"`)
    .replace(/='[^']*'/g, (m) => `='${' '.repeat(m.length - 3)}'`);
}

function maskInterpolations(literal) {
  let out = '';
  let i = 0;
  while (i < literal.length) {
    if (literal[i] === '$' && literal[i + 1] === '{') {
      out += INTERP_SENTINEL;
      i += 2;
      let depth = 1;
      while (i < literal.length && depth > 0) {
        if (literal[i] === '{') depth++;
        else if (literal[i] === '}') depth--;
        i++;
      }
    } else {
      out += literal[i];
      i++;
    }
  }
  return out;
}

// Catalog-only meta pages (not localized component templates) are exempt
// from H3 — they are documentation authored once for the catalog, like the
// <Story>/<Variant> metadata the scanner already skips.
const H3_EXEMPT = new Set(['src/templates/overview.story.vue']);

const templateFiles = walk(TEMPLATE_DIR);
let scannedCount = 0;
for (const file of templateFiles) {
  const rel = relative(ROOT, file);
  if (H3_EXEMPT.has(rel)) continue;
  const src = readFileSync(file, 'utf8');
  if (TWIG_RE.test(file)) {
    scanTwig(rel, src);
    scannedCount++;
  } else if (STORY_VUE_RE.test(file)) {
    scanStoryScriptSetup(rel, src);
    scannedCount++;
  } else if (STORY_JS_RE.test(file)) {
    scanStoryJs(rel, src);
    scannedCount++;
  }
}

if (violations.length) {
  console.error('[check-i18n] FAIL:\n  ' + violations.join('\n  '));
  process.exit(1);
}
console.log(
  `[check-i18n] OK — ${refKeys.size} keys in ${REF_LOCALE}.json, parity across ${localeFiles.length} other locale(s); ${scannedCount} template(s) scanned, no hardcoded strings.`,
);
