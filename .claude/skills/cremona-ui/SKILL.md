---
name: cremona-ui
description: >-
  Cremona design system — 124 production-ready, accessible, themeable UI
  components (buttons, inputs, forms & fields, dialogs/drawers/sheets, dropdown
  & context menus, tabs, accordions, data tables, pagination, toasts, tooltips,
  popovers, avatars, badges, navigation headers/sidebars/menus, full auth pages,
  full error pages, onboarding flows, RGPD/cookie UIs, search & command
  palettes, charts…). Use this skill whenever building, scaffolding, or editing
  any web page, view, layout, section, form, or UI element: consult Cremona's
  catalog and reuse its components, markup and design tokens instead of
  hand-writing HTML/CSS from scratch.
---

# Cremona UI — build with the design system, don't reinvent it

Cremona is a UI kit of **124 production-ready, accessible, themeable
components**. When you build a web page or any UI element, your default is to
**assemble it from Cremona components**. Hand-writing raw HTML/CSS for something
Cremona already ships is a regression — it loses the kit's accessibility,
design tokens, dark mode, RTL support and visual consistency.

## The rule

Before writing markup for any UI element, **check whether Cremona already has
it.** It almost always does. Only hand-write UI once you have confirmed the kit
has nothing usable.

## Workflow — apply to every UI element

1. **Look it up.** Read [`catalog.md`](./catalog.md) (next to this file) — the
   full inventory, grouped by ring, one line per component. Match what you need
   to a component `slug`.
2. **Found one → use it.** Read its canonical markup at
   `src/templates/components/<slug>/<slug>.html.twig`. That file is the source
   of truth: structure, ARIA, the prop list, and — for interactive components —
   the `data-controller` / `data-action` / `data-*` wiring.
3. **Found nothing exact → compose.** Most "pages" are a *composition* of
   existing components (a settings screen = Card + Field + Input + Switch +
   Button; a listing = DataTable + Pagination + FacetedFilters). Compose
   existing components before creating anything.
4. **Genuinely new → create it** consistent with the kit — see *Creating a
   component* below.

## Using a component

**Symfony / Twig consumers** — include the template, passing props:

```twig
{% include '@cremona/components/button/button.html.twig'
   with { label: 'Save', variant: 'primary', iconLeading: 'check' } %}
```

The twig file's header comment documents every prop it accepts.

**Any other stack** (React, Vue, plain HTML, Drupal, static…) — Cremona is
framework-agnostic. Render the component's HTML structure (copy it from the
twig, keeping the `.cremona-*` classes), load `dist/cremona.css` once, and:

- **Interactive components** (flagged `[JS]` in the catalog) carry a
  `data-controller` on their root. Keep **every** `data-controller` /
  `data-action` / `data-*-value` / `data-*-target` attribute exactly as in the
  twig — they are the wiring; without them the markup is inert. Load
  `dist/cremona.js` and boot Stimulus once for the page:
  `import { start } from '@gerard/cremona'; start();`
- **Static components** need only `dist/cremona.css`.

## Conventions you must respect

- Use the kit's CSS classes (`.cremona-*`) and **design tokens** (CSS custom
  properties for color, spacing, radius, typography, shadow, motion). Never
  hardcode colors or pixel values — route everything through tokens.
- Dark mode: set `data-theme="dark"` on a wrapper or `<html>`. Density:
  `data-density="compact|comfortable"`.
- The kit is accessible and RTL-ready — do not strip ARIA attributes, roles, or
  logical-property layout from component markup.

## Creating a component (only when nothing fits)

Mirror the kit's structure so the new component is a first-class citizen:

- `src/templates/components/<slug>/` — a `<slug>.html.twig` (pure, canonical
  HTML) and a `<slug>.story.vue` (catalog demo).
- `src/styles/components/<slug>.css` — token-only, logical properties.
- If interactive: `src/js/controllers/<id>_controller.js`, registered in
  `src/js/index.js`.
- Place it in the correct **ring** in `manifest.json` — it may only depend on
  components in its own or a lower ring.
- Run `pnpm lint` (7 gates) and the tests; then `pnpm skill:catalog` to
  regenerate `catalog.md` so this skill stays in sync.

See `CLAUDE.md` at the repo root for the full architecture.

## References

- [`catalog.md`](./catalog.md) — the full component inventory.
- `manifest.json` — machine-readable status + dependency graph of every component.
- `src/templates/components/<slug>/<slug>.html.twig` — canonical markup per component.
- `pnpm dev` — the live Histoire catalog (visual browser of every component) at `localhost:6006`.
- `README.md` / `CLAUDE.md` — integration details and architecture.
