# Cremona

> **Universal tokenized UI kit** — Tailwind v4 · Stimulus · Twig.
> Symfony-first, portable to React / Vue / Drupal / plain HTML.

[![CI](https://github.com/gerard-labs/cremona/actions/workflows/ci.yml/badge.svg)](https://github.com/gerard-labs/cremona/actions/workflows/ci.yml)
[![Catalog](https://img.shields.io/badge/catalog-live-8b5cf6.svg)](https://gerard-labs.github.io/cremona/)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](./LICENSE)
![Version](https://img.shields.io/badge/version-0.2.6-3b82f6.svg)
![Node](https://img.shields.io/badge/node-%E2%89%A5%2022-5fa04e.svg)
![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A5%2010-f69220.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8.svg)

**Cremona** is a framework-agnostic design system. It ships **124 components** —
from primitives (Button, Input, Tooltip…) through compounds (Dialog, DataTable,
Combobox…) to full-page patterns (Auth flows, Error pages, Dashboards…) — all
driven by one set of design tokens.

Markup is delivered as **pure-HTML Twig templates** with zero framework lock-in;
behaviour is delivered as **standalone Stimulus controllers**. A single token
layer powers light/dark themes, three density modes, and full RTL support.

📖 **[Browse the live component catalog →](https://gerard-labs.github.io/cremona/)**

---

## Contents

- [Highlights](#highlights)
- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Integration](#integration)
- [Design tokens & theming](#design-tokens--theming)
- [Internationalization & RTL](#internationalization--rtl)
- [Component catalog](#component-catalog)
- [Project layout](#project-layout)
- [Development](#development)
- [Browser support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

---

## Highlights

- 🧩 **124 components** — 33 primitives, 34 compounds, 55 page-level patterns.
- 🎨 **Token-driven** — 8 token families in `oklch`; restyle the whole kit by
  swapping one preset.
- 🌗 **Light & dark** — every token has a dark counterpart; flip one attribute.
- 📐 **3 density modes** — default, `compact`, and `cozy`, via one attribute.
- 🌍 **i18n & RTL from day one** — logical CSS properties throughout, `fr` + `en`
  translation catalogs, single-attribute direction flip.
- ♿ **Accessible by default** — ARIA wiring, focus management, and an automated
  axe-core audit on every story.
- 📦 **Dual distribution** — NPM (JS + CSS + tokens) and Composer (Twig templates
  + a minimal Symfony bridge).
- ✅ **Quality-gated** — CI runs 673 unit tests, an axe accessibility audit, a
  PHPUnit suite for the Symfony bridge, the library build, and 7 lint gates;
  a Playwright visual-regression suite ships too.

---

## Requirements

| Tool                              | Version |
| --------------------------------- | ------- |
| Node.js                           | ≥ 22    |
| pnpm                              | ≥ 10    |
| PHP — *Symfony bridge, optional*  | ≥ 8.4   |
| Symfony — *bridge, optional*      | ≥ 7.4   |

The JavaScript/CSS layer is self-contained. PHP is only needed if you consume the
Twig templates through the Symfony bridge.

---

## Quickstart

```bash
pnpm install        # install dependencies
pnpm dev            # open the Histoire catalog → http://localhost:6006
pnpm build          # build the library → dist/cremona.js + dist/cremona.css
pnpm test:run       # run the 673 unit tests
pnpm lint           # stylelint · eslint · anti-drift checks
```

`pnpm dev` is the fastest way to explore locally — or browse the
**[hosted catalog](https://gerard-labs.github.io/cremona/)**, redeployed from
`main` on every push. The [Histoire](https://histoire.dev) catalog renders every
component with light/dark and responsive presets.

---

## Integration

The kit is consumed two ways — pick whichever fits your stack. Both can be used
together (Twig for markup, the JS bundle for behaviour).

### Option A — Symfony (Twig templates + Composer bridge)

The bridge registers the `@cremona` Twig namespace and wires the translation
catalogs into the Symfony Translator.

1. Add the package as a VCS repository in `composer.json` and require it:

   ```jsonc
   {
     "repositories": [
       { "type": "vcs", "url": "https://github.com/gerard-labs/cremona.git" }
     ]
   }
   ```

   ```bash
   composer require gerard/cremona:dev-main
   ```

2. Register the bundle (`config/bundles.php`):

   ```php
   return [
       // …
       Gerard\Cremona\Bridge\Symfony\CremonaBundle::class => ['all' => true],
   ];
   ```

3. Use any component from a template:

   ```twig
   {% include '@cremona/components/button/button.html.twig' with {
       label: 'Enregistrer',
       variant: 'primary',
       iconLeading: 'check',
   } %}
   ```

4. Load the styles and boot the controllers in your app entrypoint:

   ```js
   // assets/app.js
   import '@gerard/cremona/cremona.css';
   import { start } from '@gerard/cremona';

   start(); // boots Stimulus + registers every kit controller
   ```

The bridge has zero configuration — it only registers the `@cremona` namespace and
the `fr.json` / `en.json` translation catalogs.

### Option B — JavaScript bundler (Vite, Webpack, Rspack…)

```js
import '@gerard/cremona/cremona.css';
import { start } from '@gerard/cremona';

start(); // auto-boots a Stimulus application on <html>
```

Already running your own Stimulus application? Register the kit's controllers
into it instead of auto-booting:

```js
import { Application } from '@hotwired/stimulus';
import { register } from '@gerard/cremona';

const application = Application.start();
register(application); // adds all 58 kit controllers
```

### Option C — plain HTML / CDN

```bash
pnpm build   # produces dist/cremona.js (ESM) + dist/cremona.css
```

```html
<link rel="stylesheet" href="/cremona.css" />
<script type="module">
  import { start } from '/cremona.js';
  start();
</script>
```

> `dist/cremona.js` lists `@hotwired/stimulus` and `dayjs` as externals — provide
> them via an import map, or bundle them in for a fully standalone build.

---

## Design tokens & theming

Every visual decision is a CSS custom property. Components reference tokens only —
they never hard-code a colour, radius, or duration.

### Token families

| Family      | File                      | Examples |
| ----------- | ------------------------- | -------- |
| Color       | `tokens/color.css`        | `--color-primary`, `--color-bg-base`, `--color-text-primary` |
| Spacing     | `tokens/spacing.css`      | `--spacing-1` … `--spacing-16` |
| Radius      | `tokens/radius.css`       | `--radius-sm`, `--radius-card`, `--radius-pill` |
| Font        | `tokens/font.css`         | `--font-sans`, `--font-size-base`, `--font-weight-medium` |
| Shadow      | `tokens/shadow.css`       | `--shadow-1` … `--shadow-4` |
| Motion      | `tokens/motion.css`       | `--motion-duration-fast`, `--motion-easing-standard` |
| Density     | `tokens/density.css`      | `--density-input-height`, `--density-gap` |
| Z-index     | `tokens/z-index.css`      | `--z-sticky`, `--z-modal`, `--z-toast` |

Colors are authored in `oklch()` for perceptually uniform light/dark pairs. The
tokens are also bridged into Tailwind v4's `@theme`, so utilities such as
`bg-primary` or `text-success` resolve to the same variables.

### Dark mode

Set `data-theme="dark"` on `<html>` (or any ancestor). Every token flips to its
dark value — no per-component dark styles needed.

```html
<html data-theme="dark">
```

The **Theme Switcher** pattern (`theme-switcher` controller) provides a ready-made
light / dark / system toggle that persists the choice.

### Density

Set `data-density` to scale spacing and control heights:

```html
<body data-density="compact">  <!-- default · compact · cozy -->
```

The **Density Switcher** pattern offers a built-in control.

### Presets

`src/styles/presets/default.css` is the shipped brand skin. To re-brand the kit,
copy it, override the brand tokens, and import your preset after `cremona.css` —
every component re-skins for free.

---

## Internationalization & RTL

i18n is mandatory, not an afterthought:

- **Logical CSS properties everywhere** (`margin-inline`, `inset-block-start`…) —
  enforced by lint. RTL is a single attribute flip.
- **Translation catalogs** — `src/js/i18n/{fr,en}.json`, flat `theme.*.*` keys.
- **Runtime helper** — a tiny `t()` with `Intl.PluralRules` plurals and `{name}`
  interpolation.

```js
import { t, setLocale, setDirection } from '@gerard/cremona';

setLocale('en');         // also reflects on <html lang>
setDirection('rtl');     // flips <html dir> — logical CSS does the rest
t('theme.common.actions.save');             // → "Save"
t('theme.form.tag-input.count', { count: 3 }); // pluralized
```

Symfony apps can ignore `t()` entirely — the bridge registers the same JSON
catalogs with the Symfony Translator, so `{{ 'theme.common.actions.save'|trans }}`
works server-side.

---

## Component catalog

Components are organized in **rings** — each ring builds only on lower ones (see
[Development](#development)). Browse them all live with `pnpm dev`.

**Ring 1 — Primitives (33)**
Accordion · Alert · AspectRatio · Avatar · Badge · Breadcrumb · Button ·
ButtonGroup · Card · Checkbox · Collapsible · Divider · Empty · Field · Icon ·
Input · InputGroup · Item · Kbd · Label · NativeSelect · Progress · RadioGroup ·
Separator · Skeleton · Slider · Spinner · Switch · Textarea · Toggle ·
ToggleGroup · Tooltip · Typography

**Ring 2 — Compounds (34)**
AlertDialog · AvatarGroup · Calendar · Carousel · Chart · Combobox · Command ·
ContextMenu · DataTable · DatePicker · DescriptionList · Dialog · Drawer ·
DropdownMenu · FileUpload · HoverCard · InputOTP · Menubar · NavigationMenu ·
NumberInput · Pagination · Popover · Resizable · ScrollArea · Select · Sheet ·
Sidebar · Sonner · Status · Stepper · Table · Tabs · Tag · Toast

**Ring 3 — Patterns (55)**
Authentication (Login, Register, Forgot/Reset Password, OTP, Magic Link, SSO,
Social Buttons, Password Strength, Session Timeout, Account Locked, Email
Verification) · Error pages (401, 403, 404, 500, 503, Maintenance, Offline, Rate
Limited, Browser Unsupported, Coming Soon) · Onboarding (Welcome Screens, Product
Tour, Checklist) · Navigation (Header, Mega Menu, Sidebar App, Mobile Drawer,
Bottom Mobile, Mega Footer) · Search (Command Palette, Results, Faceted Filters) ·
Forms (With Steps, File Upload, Address Autocomplete, Phone Input, Tag Input,
Signature, Color Picker, Date Range) · GDPR (Cookie Banner, Preferences Center,
Data Export) · Chatbot · Back to Top · Notification Center · Activity Feed ·
Keyboard Shortcuts Overlay · Danger Zone · Theme / Density / Lang Switchers ·
Roles Matrix

Heavy patterns lazy-load their third-party dependency on first use (ApexCharts,
FilePond, Tagify, intl-tel-input, SignaturePad, Coloris, driver.js, SortableJS),
so the base bundle stays small.

---

## Project layout

```
theme/
├── manifest.json            # machine-readable status of every component
├── package.json             # NPM package (JS + CSS)
├── composer.json            # Composer package (Twig + Symfony bridge)
├── vite.config.js            # library build (cremona.js + cremona.css)
├── histoire.config.js        # component catalog config
├── Bridge/Symfony/           # minimal Symfony bundle (@cremona namespace)
├── src/
│   ├── styles/
│   │   ├── tokens/           # the 8 token families
│   │   ├── base/             # reset + base typography
│   │   ├── components/       # one stylesheet per component
│   │   ├── presets/          # brand skins
│   │   └── cremona.css         # main entry (tokens + base + components)
│   ├── js/
│   │   ├── controllers/      # 58 Stimulus controllers
│   │   ├── i18n/             # fr.json + en.json catalogs
│   │   ├── utils/            # i18n runtime, date formatting, helpers
│   │   └── index.js          # boot / register entrypoint
│   ├── templates/components/ # one .html.twig + .story.vue per component
│   └── assets/icons/         # curated Lucide SVG set
├── tools/                    # anti-drift lint scripts
└── tests/                    # unit (Vitest) · a11y + visual (Playwright)
```

---

## Development

### Scripts

| Command                | What it does |
| ---------------------- | ------------ |
| `pnpm dev`             | Histoire catalog dev server (`localhost:6006`) |
| `pnpm build`           | Library build → `dist/cremona.js` + `dist/cremona.css` |
| `pnpm histoire:build`  | Static catalog → `.histoire/dist/` |
| `pnpm test` / `test:run` | Vitest unit tests (watch / single run) |
| `pnpm test:a11y`       | axe-core accessibility audit (Playwright) |
| `pnpm test:visual`     | Visual-regression screenshots (Playwright) |
| `pnpm lint`            | All 7 lint gates (see below) |
| `pnpm format`          | Prettier write |

### Quality gates

`pnpm lint` runs seven checks, all enforced in CI:

| Gate              | Checks |
| ----------------- | ------ |
| `lint:css`        | stylelint — logical properties, token usage, no raw colors |
| `lint:js`         | eslint |
| `lint:logical`    | custom grep — physical CSS property guard |
| `lint:i18n`       | custom grep — translation-key integrity |
| `lint:manifest`   | ring invariants + `dependsOn` graph (`tools/check-manifest.js`) |
| `lint:tokens`     | light/dark token parity |
| `lint:composition`| component composition rules |

Beyond lint, CI also runs the unit tests, the library build, the accessibility
audit, and the Symfony bridge's PHPUnit suite — see
[the workflow](./.github/workflows/ci.yml).

### Symfony bridge tests

The PHP bridge under `Bridge/Symfony/` ships its own PHPUnit suite (needs
PHP ≥ 8.4 and Composer):

```bash
composer install
composer test
```

It exercises the bundle's DI extension — `@cremona` Twig namespace registration
and translation-catalog discovery.

### The ring methodology

Components live in **rings**, tracked in [`manifest.json`](./manifest.json):

- **Ring 0** — Foundations (build, tokens, base styles, Stimulus boot, i18n).
- **Ring 1** — Primitives.
- **Ring 2** — Compounds (built from primitives).
- **Ring 3** — Patterns (full-page compositions).

A component may only depend on items in its own or a lower ring; `dependsOn` must
form an acyclic graph. `tools/check-manifest.js` enforces both invariants.

---

## Browser support

Modern evergreen browsers — the last two versions of Chrome, Edge, Firefox, and
Safari. The kit uses `oklch()` colors and CSS logical properties, which require
**Safari 15.4+** (March 2022) and equivalent.

---

## Contributing

1. `pnpm install`, then `pnpm dev` to work against the live catalog.
2. Keep every change green: `pnpm lint && pnpm test:run && pnpm build`.
3. A new component needs its `.html.twig`, `.story.vue`, `.css`, a `manifest.json`
   entry, and — if interactive — a Stimulus controller with unit tests.
4. Respect the invariants: tokens only (no raw values), logical CSS properties,
   translation keys for all user-facing text, ARIA wired from the start.

---

## License

[MIT](./LICENSE) © Gerard Labs.

Icons are from [Lucide](https://lucide.dev) (ISC License) — see
[`src/assets/icons/README.md`](./src/assets/icons/README.md).
