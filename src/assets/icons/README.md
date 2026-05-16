# Icons — curated Lucide subset

> 50 raw SVG icons used across the kit's components. Source:
> [Lucide](https://lucide.dev) — ISC License, see
> [`/LICENSE-icons.txt`](../../../LICENSE-icons.txt). Pinned to **Lucide 0.469.0**.

## How the kit consumes these

- **Stories (`.story.vue`)** — Vite's `?raw` import inlines the SVG:

  ```js
  import iconUserRaw from '@/assets/icons/user.svg?raw';
  ```

- **Twig (`.html.twig`)** — Symfony Twig's `source()` function inlines it:

  ```twig
  {{ source('@cremona/assets/icons/' ~ name ~ '.svg')|raw }}
  ```

The Icon primitive (`src/templates/components/icon/`) wraps both paths and
applies sizing, ARIA, and the RTL flip rule.

## RTL flip whitelist

A few icons are direction-sensitive — they mirror in RTL via the
`.theme-icon-bidi` class applied by the Icon primitive. The whitelist lives in
the `_bidiIcons` array inside `icon.html.twig`:

| Icon                            | Why it flips |
| ------------------------------- | ------------ |
| `arrow-left`, `arrow-right`     | Directional arrows mirror with reading direction |
| `chevron-left`, `chevron-right` | Disclosure / navigation chevrons mirror |
| `corner-down-left`              | Conveys the Enter key — the line + turn must read naturally |
| `send`                          | Paper-plane points towards the recipient |
| `log-out`                       | Door + exit-arrow points inline-end |

All other icons are semantic and never flip.

## Adding an icon

1. Drop the raw 24×24 Lucide SVG into this folder — `fill="none"`,
   `stroke="currentColor"`, `stroke-width="2"`. The Icon primitive owns sizing.
2. If it must flip in RTL, add its name to `_bidiIcons` in `icon.html.twig`
   and to the table above.

## Source name mappings

A few local names differ from Lucide's current names — kept for semantic clarity:

| Local file            | Lucide 0.469.0 source |
| --------------------- | --------------------- |
| `alert-circle.svg`    | `circle-alert.svg`    |
| `alert-triangle.svg`  | `triangle-alert.svg`  |
| `more-horizontal.svg` | `ellipsis.svg`        |
| `edit-3.svg`          | `square-pen.svg`      |
| `bar-chart.svg`       | `chart-bar.svg`       |
