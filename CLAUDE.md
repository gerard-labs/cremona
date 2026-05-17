# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Cremona** is a framework-agnostic, tokenized UI kit (Tailwind v4 + Stimulus + Twig).
It ships three independent artifacts and **never ships Vue or a framework runtime to
consumers**:

- `dist/cremona.js` — Stimulus boot + the 58 controllers (ESM library).
- `dist/cremona.css` — Tailwind v4 compiled: tokens + reset + every component's styles.
- `src/templates/components/**/*.html.twig` — the canonical pure-HTML markup.

Requires **Node ≥ 22** and **pnpm**. The Symfony bridge requires **PHP ≥ 8.4**.

## Commands

```bash
pnpm dev                 # Histoire catalog dev server (localhost:6006)
pnpm build               # Library build → dist/cremona.js + dist/cremona.css
pnpm histoire:build      # Static catalog → .histoire/dist/
pnpm test                # Vitest unit tests (watch)
pnpm test:run            # Vitest single run
pnpm test:run <path>     # Run one unit test file
pnpm test:run -t "<name>"# Run unit tests matching a name
pnpm test:a11y           # axe-core audit on every story (Playwright)
pnpm test:e2e            # E2E: controller interactions (Playwright)
pnpm test:e2e <file>     # Run one E2E spec   (add -g "<title>" for one test)
pnpm test:visual         # Visual-regression screenshots (Playwright)
pnpm lint                # All 7 lint gates (also: pnpm lint:i18n etc. for one)
composer test            # Symfony bridge PHPUnit suite (run from repo root)
```

`pnpm build` is **two Vite passes** (see `vite.config.js`): the default pass builds the
JS library from `src/js/index.js` (externalizes `@hotwired/stimulus` + `dayjs`); the
`--mode css` pass routes `src/styles/cremona.css` through a virtual entry so the
Tailwind v4 plugin compiles it. The JS entry deliberately does **not** import the CSS —
consumers load styles independently.

## Architecture

### The ring methodology

`manifest.json` is the machine-readable source of truth for every component's status
and dependency graph. Components live in **rings**: 0 Foundations · 1 Primitives ·
2 Compounds · 3 Patterns. A component may only `dependsOn` items in its own or a lower
ring, and the graph must be acyclic — `tools/check-manifest.js` (`lint:manifest`)
enforces both.

### Component anatomy

Each component is a folder `src/templates/components/<slug>/` containing:

- `<slug>.html.twig` — the canonical markup; **the source of truth** for structure,
  ARIA, and all `data-controller` / `data-action` / `data-*-value` wiring.
- `<slug>.story.vue` — its Histoire catalog story.

Plus `src/styles/components/<slug>.css` and, if interactive,
`src/js/controllers/<id>_controller.js`.

### The story pattern

A `.story.vue` is a Histoire SFC that injects **pure HTML via `v-html`** of a JS
template literal — Vue is the catalog host runtime *only*, never componentry. A story
must mirror its `.html.twig`, including the controller wiring: a story that renders the
markup but omits `data-controller`/`data-action` produces dead, non-interactive markup
in the catalog. Stories declare `group="Ring N"`; the sidebar tree is built from each
story's `title` (`/` = folder). `histoire.setup.js` boots Stimulus once per story.

### Stimulus

Controllers live in `src/js/controllers/` and are registered in `src/js/index.js`.
`boot(root)` starts a Stimulus Application and registers every controller (idempotent —
guarded by `data-theme-booted`); `register(app)` lets a consumer use their own
Application. Controllers commonly **compose on the same element** (e.g.
`data-controller="popover dropdown-menu"`).

### Tokens & theming

8 token families in `src/styles/tokens/` (color, spacing, radius, font, shadow, motion,
density, z-index), oklch-based. `src/styles/cremona.css` is the main entry and order
matters: `@import "tailwindcss"` (string notation — `url()` breaks Tailwind v4) → token
files → base → components → the `@theme` mapping. Dark mode = `data-theme="dark"`;
density = `data-density`.

### i18n

`src/js/i18n/fr.json` is the **reference locale**; other locales (`en.json`) must have
exact key parity. The `t()` runtime lives in `src/js/utils/i18n.js`. **No hardcoded
user-facing strings** in `.html.twig` / `.story.vue` — text must go through
`{{ t('theme.…') }}` (Twig) or `${t('theme.…')}` (story literals). `tools/check-i18n.js`
(`lint:i18n`) enforces this.

### Symfony bridge

`Bridge/Symfony/` is a minimal bundle (`Gerard\Cremona\Bridge\Symfony` namespace) that
registers the `@cremona` Twig namespace and the translation catalogs. Tested with
PHPUnit via `composer test`.

## Conventions

- CSS class prefix is `.cremona-*`. Component CSS uses **logical properties only** (no
  `left`/`right`/`margin-top`… — `lint:logical` guards this) and **no raw colors or px**
  — everything routes through tokens (`lint:css`, `lint:tokens`).
- All 7 lint gates (`lint:css`, `js`, `logical`, `i18n`, `manifest`, `tokens`,
  `composition`) are CI-gated, alongside unit tests, build, a11y, e2e, and PHPUnit
  (`.github/workflows/ci.yml`).
- **The word "theme" is intentional in some places** — the project was renamed
  theme→cremona, but `theme` survives where it is the *concept*, not the old name:
  the `data-theme` dark-mode attribute, the `theme-switcher` component, `theme.*` i18n
  keys, Tailwind's `@theme` directive, and the internal `data-theme-booted` flag. Do not
  "fix" these to `cremona`.

## E2E tests

Specs in `tests/e2e/` drive real controller interactions through each component's
Histoire story sandbox. `tests/e2e/_support.js` exposes `sandbox(slug)` which builds the
standalone story URL — the `slug` is the component **folder name** (e.g.
`form-address-autocomplete`, not `address-autocomplete`). E2E and a11y run against a
built catalog, so `pnpm histoire:build` must succeed first. Interactions that cannot run
reliably in headless Chromium (driver.js tours, ApexCharts, hover timing) are covered as
smoke tests rather than deep interaction tests.
