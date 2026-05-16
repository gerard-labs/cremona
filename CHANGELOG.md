# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.6] — 2026-05-16

Initial public release.

### Added

- **124 components** across three rings — 33 primitives, 34 compounds, and 55
  page-level patterns.
- **8 design-token families** authored in `oklch`, with full light/dark parity
  and three density modes (`default`, `compact`, `cozy`).
- **58 Stimulus controllers**; heavy patterns lazy-load their third-party
  dependency on first use to keep the base bundle small.
- **i18n & RTL** layer — `fr` + `en` translation catalogs, a `t()` runtime with
  `Intl.PluralRules` plurals, and logical CSS properties throughout.
- **Symfony bridge** — registers the `@theme` Twig namespace and auto-discovers
  the translation catalogs through the Symfony Translator.
- **Library build** emitting `dist/theme.js` (ESM) and a compiled `dist/theme.css`.
- **Quality gates** — 673 unit tests, an axe-core accessibility suite, Playwright
  visual-regression tests, and 7 lint checks, all wired into GitHub Actions CI.
