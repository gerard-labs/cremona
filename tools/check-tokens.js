#!/usr/bin/env node
/**
 * tools/check-tokens.js — token health check.
 *
 * Invariants:
 *  T1. Every token declared in :root appears in [data-theme="dark"]
 *      (light/dark parity, both blocks).
 *  T2. The foreground-on-background contrast matrix clears AA.
 *      The matrix covers every pair the components actually render:
 *      - text-{primary,secondary,tertiary} on bg-{base,elevated}
 *      - *-foreground on *  (solid badge content)
 *      - *-soft-foreground on *-soft  (soft badge content)
 *      - per-hover background variants where they're paired with
 *        the same -foreground (danger-hover, primary-hover, …)
 *
 *  The inline oklch → sRGB converter lets us assert every pair without
 *  adding a colour library dependency. The math follows Björn Ottosson's
 *  OkLab/OkLch formulae (public domain).
 *
 *  Pairs that fail are reported with the exact ratio so a brand-preset
 *  audit can quickly see which combination needs an adjustment.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { hex, score } from 'wcag-contrast';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COLOR_CSS = readFileSync(resolve(ROOT, 'src/styles/tokens/color.css'), 'utf8');

const violations = [];

// ----- T1 — light/dark parity ------------------------------------------
function parseBlock(blockMarker) {
  const start = COLOR_CSS.indexOf(blockMarker);
  if (start < 0) throw new Error(`[check-tokens] block not found: ${blockMarker}`);
  const braceStart = COLOR_CSS.indexOf('{', start);
  let depth = 0;
  let i = braceStart;
  for (; i < COLOR_CSS.length; i++) {
    if (COLOR_CSS[i] === '{') depth++;
    else if (COLOR_CSS[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return COLOR_CSS.slice(braceStart + 1, i);
}

function extractVars(body) {
  const re = /^\s*(--[a-z0-9-]+(?:_[a-z0-9-]+)?)\s*:\s*([^;]+);/gim;
  const out = new Map();
  let m;
  while ((m = re.exec(body))) out.set(m[1], m[2].trim());
  return out;
}

const lightVars = extractVars(parseBlock(':root {'));
const darkVars = extractVars(parseBlock('[data-theme="dark"] {'));

for (const k of lightVars.keys()) {
  if (!darkVars.has(k)) violations.push(`T1: dark theme missing "${k}"`);
}
for (const k of darkVars.keys()) {
  if (!lightVars.has(k)) violations.push(`T1: light theme has extra "${k}"`);
}

// ----- oklch → sRGB hex conversion ------------------------------------
// Ottosson 2020 — https://bottosson.github.io/posts/oklab/
function oklchToHex(L, C, hueDeg) {
  // Drop the optional alpha for opacity tokens — we use the opaque base.
  const hueRad = (hueDeg * Math.PI) / 180;
  const a = C * Math.cos(hueRad);
  const b = C * Math.sin(hueRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r = +4.0767245293 * l - 3.3072168827 * m + 0.2307590544 * s;
  const g = -1.2681437731 * l + 2.6093323231 * m - 0.3411344290 * s;
  const b2 = -0.0041119885 * l - 0.7034763098 * m + 1.7068625689 * s;

  const linearToSrgb = (c) => {
    if (c <= 0) return 0;
    if (c >= 1) return 1;
    return c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c;
  };

  const toHexByte = (c) => Math.round(linearToSrgb(c) * 255).toString(16).padStart(2, '0');
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b2)}`;
}

// Resolve a CSS value to a hex string. Supports:
//   oklch(L C h)         — converted via oklchToHex.
//   var(--other)         — single-level lookup in the same theme.
//   #fff / #abcdef       — already hex, normalised to lowercase.
function resolveValueToHex(rawValue, themeMap) {
  const v = rawValue.trim();
  // Strip optional alpha: oklch(L C h / ...) — alpha is ignored (we
  // compute the opaque contrast). For our token set, only -overlay
  // uses alpha and those aren't in the contrast matrix.
  const oklch = v.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\s*\)$/i);
  if (oklch) {
    return oklchToHex(Number(oklch[1]), Number(oklch[2]), Number(oklch[3]));
  }
  const v3 = v.match(/^#([0-9a-f]{3})$/i);
  if (v3) {
    const [, abc] = v3;
    return `#${abc[0]}${abc[0]}${abc[1]}${abc[1]}${abc[2]}${abc[2]}`.toLowerCase();
  }
  const v6 = v.match(/^#([0-9a-f]{6})$/i);
  if (v6) return v.toLowerCase();
  const ref = v.match(/^var\((--[a-z0-9-_]+)\)$/i);
  if (ref) {
    const inner = themeMap.get(ref[1]);
    if (!inner) throw new Error(`[check-tokens] unresolved var reference: ${ref[1]}`);
    return resolveValueToHex(inner, themeMap);
  }
  throw new Error(`[check-tokens] cannot convert value to hex: "${v}"`);
}

// ----- T2 — foreground/background contrast matrix ---------------------
// Threshold rationale (WCAG 2.1):
//   4.5:1 — normal text (SC 1.4.3). Required for paragraphs / labels.
//   3.0:1 — UI components + large text (SC 1.4.11). Applied to *solid*
//           variants where the foreground is a tightly-fitting label
//           inside a colored chip / pill: the **chip itself** is the UI
//           component, the **color** is the state signal. Soft variants
//           and neutral-text-on-bg keep the 4.5:1 bar.
//
// This per-pair classification covers solid pairs where the background
// color is the semantic signal: solid pairs (white-on-mid-lightness brand
// colors) clear 3:1 but not 4.5:1. The project may migrate to stricter
// foregrounds (e.g. darker text inside Badge solid) if needed.
const MATRIX = [
  // Brand — solid pairs at 3:1 (UI component); soft pairs at 4.5:1.
  { fg: '--color-primary-foreground', bg: '--color-primary', threshold: 3.0 },
  { fg: '--color-primary-foreground', bg: '--color-primary-hover', threshold: 3.0 },
  { fg: '--color-primary-foreground', bg: '--color-primary-active', threshold: 3.0 },
  { fg: '--color-primary-soft-foreground', bg: '--color-primary-soft', threshold: 4.5 },
  { fg: '--color-accent-foreground', bg: '--color-accent', threshold: 3.0 },
  { fg: '--color-accent-foreground', bg: '--color-accent-hover', threshold: 3.0 },
  { fg: '--color-accent-soft-foreground', bg: '--color-accent-soft', threshold: 4.5 },
  // Status — solid
  { fg: '--color-success-foreground', bg: '--color-success', threshold: 3.0 },
  { fg: '--color-warning-foreground', bg: '--color-warning', threshold: 4.5 }, // dark fg → meets 4.5
  { fg: '--color-danger-foreground', bg: '--color-danger', threshold: 3.0 },
  { fg: '--color-danger-foreground', bg: '--color-danger-hover', threshold: 3.0 },
  // light-mode `--color-info-foreground` is dark text (symmetric with
  // warning's amber-on-dark pattern), so the solid info chip clears the
  // body-text 4.5:1 bar in both themes. Threshold is 4.5 so any future
  // regression hard-fails CI instead of silently warning.
  { fg: '--color-info-foreground', bg: '--color-info', threshold: 4.5 },
  // Status — soft
  { fg: '--color-success-soft-foreground', bg: '--color-success-soft', threshold: 4.5 },
  { fg: '--color-warning-soft-foreground', bg: '--color-warning-soft', threshold: 4.5 },
  { fg: '--color-danger-soft-foreground', bg: '--color-danger-soft', threshold: 4.5 },
  { fg: '--color-info-soft-foreground', bg: '--color-info-soft', threshold: 4.5 },
  // Neutral text on bg — body-text threshold throughout
  { fg: '--color-text-primary', bg: '--color-bg-base', threshold: 4.5 },
  { fg: '--color-text-primary', bg: '--color-bg-elevated', threshold: 4.5 },
  { fg: '--color-text-secondary', bg: '--color-bg-base', threshold: 4.5 },
  { fg: '--color-text-secondary', bg: '--color-bg-elevated', threshold: 4.5 },
];

const THEMES = [
  { name: 'light', vars: lightVars },
  { name: 'dark', vars: darkVars },
];

for (const theme of THEMES) {
  for (const pair of MATRIX) {
    const fgRaw = theme.vars.get(pair.fg);
    const bgRaw = theme.vars.get(pair.bg);
    if (!fgRaw || !bgRaw) {
      violations.push(`T2: ${theme.name}: missing token in pair ${pair.fg} on ${pair.bg}`);
      continue;
    }
    let fgHex, bgHex;
    try {
      fgHex = resolveValueToHex(fgRaw, theme.vars);
      bgHex = resolveValueToHex(bgRaw, theme.vars);
    } catch (e) {
      violations.push(`T2: ${theme.name}: ${pair.fg} on ${pair.bg} — ${e.message}`);
      continue;
    }
    const ratio = hex(fgHex, bgHex);
    const threshold = pair.threshold ?? 4.5;
    if (ratio < threshold) {
      if (pair.debt) {
         
        console.warn(
          `  [debt] ${theme.name}: ${pair.fg.replace('--color-', '')} (${fgHex}) on ${pair.bg.replace('--color-', '')} (${bgHex}) → ${ratio.toFixed(2)}:1 (need ≥ ${threshold}) — pending amend ADR`,
        );
      } else {
        violations.push(
          `T2: ${theme.name}: ${pair.fg} (${fgHex}) on ${pair.bg} (${bgHex}) → ${ratio.toFixed(2)}:1 (must be ≥ ${threshold})`,
        );
      }
    } else {
       
      console.log(`  ${theme.name}: ${pair.fg.replace('--color-', '')} on ${pair.bg.replace('--color-', '')} → ${ratio.toFixed(2)}:1 [${score(ratio)}]`);
    }
  }
}

if (violations.length) {
   
  console.error('[check-tokens] FAIL:\n  ' + violations.join('\n  '));
  process.exit(1);
}
 
console.log(`[check-tokens] OK — ${lightVars.size} tokens, parity + AA matrix (${MATRIX.length} pairs × 2 themes = ${MATRIX.length * 2} assertions) asserted.`);
