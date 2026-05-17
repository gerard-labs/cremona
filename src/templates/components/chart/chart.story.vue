<!--
  Chart story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6) :
    1. KPI sparkline cluster — 4 KPI cards with embedded sparklines.
    2. Line variant — monthly sales trend with 2 series.
    3. Bar variant — category breakdown with single series.
    4. Donut variant — distribution percentages.
    5. Area variant — stacked area over time.
    6. Events log — chart:series-click + chart:render-complete demo.

  Helpers (nested template literal avoidance) :
    - chart({ id, variant, series, categories, label, height, ... })
    - kpiCard({ label, value, trend, series })

  NOTE : the story relies on the lazy-loaded ApexCharts chunk. In Histoire's
  dev server, the dynamic import resolves from node_modules ; in production
  consumer apps, the chunk is fetched on first chart mount per session.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  // Wire the events log demo.
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const id = log.getAttribute('data-events-log');
    const wrap = document.getElementById(id);
    if (!wrap) continue;
    const out = log.querySelector('[data-events-out]');
    wrap.addEventListener('chart:render-complete', (e) => {
      const line = document.createElement('div');
      line.textContent = `chart:render-complete (${e.detail.variant})`;
      if (out) out.appendChild(line);
    });
    wrap.addEventListener('chart:series-click', (e) => {
      const d = e.detail;
      const line = document.createElement('div');
      line.textContent = `chart:series-click → series=${d.seriesIndex} point=${d.dataPointIndex} value=${d.value}`;
      if (out) out.appendChild(line);
    });
  }
});

let _chartCounter = 0;
function nextId(prefix = 'cha') { return `${prefix}-${++_chartCounter}`; }

function S(key) { return t('theme.chart.story.' + key); }

function chart({
  id,
  variant = 'line',
  series = [],
  categories = [],
  label = '',
  height = 240,
  categoriesLabel = null,
  showCaption = true,
}) {
  const wrapId = id || nextId('cha');
  const seriesJson = JSON.stringify(series).replace(/"/g, '&quot;');
  const categoriesJson = JSON.stringify(categories).replace(/"/g, '&quot;');
  const isDonut = variant === 'donut';
  const catLbl = categoriesLabel || S('table.category-label');
  const tableHead = isDonut
    ? `<tr><th scope="col">${catLbl}</th><th scope="col">${S('table.value-label')}</th></tr>`
    : `<tr><th scope="col">${catLbl}</th>${series.map((s, i) => `<th scope="col">${s.name || 'Series ' + (i + 1)}</th>`).join('')}</tr>`;
  const tableBody = isDonut
    ? series.map((value, i) => `<tr><th scope="row">${categories[i] || ''}</th><td>${value}</td></tr>`).join('')
    : categories.map((cat, i) => {
        const cells = series.map((s) => {
          const point = s.data && s.data[i] != null ? s.data[i] : '';
          const val = (point && typeof point === 'object' && 'y' in point) ? point.y : point;
          return `<td>${val}</td>`;
        }).join('');
        return `<tr><th scope="row">${cat}</th>${cells}</tr>`;
      }).join('');
  const caption = showCaption ? `<figcaption class="cremona-chart__caption">${label}</figcaption>` : '';
  return `<figure id="${wrapId}" class="cremona-chart"
    data-controller="chart"
    data-chart-variant-value="${variant}"
    data-chart-series-value="${seriesJson}"
    data-chart-categories-value="${categoriesJson}"
    data-chart-height-value="${height}"
    data-chart-locale-value="fr"
    data-state="loading"
    role="img"
    aria-roledescription="${S('aria.role-description')}"
    aria-label="${label}">
    <div class="cremona-chart__container" data-chart-target="container"
         style="min-block-size: ${height}px;" aria-hidden="true"></div>
    ${caption}
    <div class="cremona-chart__sr-only">
      <table>
        <caption>${label}</caption>
        <thead>${tableHead}</thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>
  </figure>`;
}

function kpiCard({ label, value, trend, series }) {
  const id = nextId('kpi');
  return `<div class="cha-story__kpi">
    <div class="cha-story__kpi-meta">
      <span class="cha-story__kpi-label">${label}</span>
      <span class="cha-story__kpi-value">${value}</span>
      <span class="cha-story__kpi-trend" data-trend="${trend >= 0 ? 'up' : 'down'}">${trend >= 0 ? '+' : ''}${trend}%</span>
    </div>
    ${chart({
      id,
      variant: 'sparkline',
      series: [{ name: label, data: series }],
      categories: series.map((_, i) => String(i + 1)),
      label,
      height: 60,
      showCaption: false,
    })}
  </div>`;
}

const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jui', 'Aoû'];
const monthsCount = months.length;
const trendData = Array.from({ length: monthsCount }, (_, i) => 80 + Math.round(30 * Math.sin(i / 2)) + i * 5);

const bodyHtml = `
  <section class="cha-story" data-testid="chart-root">
    <header class="cha-story__header">
      <h1>${t('theme.chart.story.title')}</h1>
      <p>${t('theme.chart.story.subtitle')}</p>
    </header>

    <section class="cha-story__section" aria-labelledby="cha-section-kpi">
      <h2 id="cha-section-kpi" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.kpi')}</h2>
      <p class="cha-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.kpi')}</p>
      <div class="cha-story__kpi-grid">
        ${kpiCard({ label: S('kpi.revenue'), value: '€ 142 380', trend: 8.4, series: [110, 120, 115, 135, 140, 138, 152, 142] })}
        ${kpiCard({ label: S('kpi.signups'), value: '1 248', trend: 12.7, series: [80, 95, 100, 110, 115, 120, 130, 124] })}
        ${kpiCard({ label: S('kpi.churn'), value: '2.1%', trend: -0.4, series: [3.2, 3.0, 2.8, 2.6, 2.5, 2.4, 2.2, 2.1] })}
        ${kpiCard({ label: S('kpi.nps'), value: '64', trend: 4.2, series: [55, 58, 60, 59, 61, 62, 63, 64] })}
      </div>
    </section>

    <section class="cha-story__section" aria-labelledby="cha-section-line">
      <h2 id="cha-section-line" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.line')}</h2>
      <p class="cha-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.line')}</p>
      ${chart({
        variant: 'line',
        label: S('line.label'),
        categories: months,
        series: [
          { name: S('line.series-2025'), data: trendData.map((v) => v - 10) },
          { name: S('line.series-2026'), data: trendData },
        ],
        height: 280,
      })}
    </section>

    <section class="cha-story__section" aria-labelledby="cha-section-bar">
      <h2 id="cha-section-bar" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.bar')}</h2>
      <p class="cha-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.bar')}</p>
      ${chart({
        variant: 'bar',
        label: S('bar.label'),
        categories: [S('bar.cat-1'), S('bar.cat-2'), S('bar.cat-3'), S('bar.cat-4'), S('bar.cat-5')],
        series: [{ name: S('bar.series-name'), data: [42, 56, 38, 64, 51] }],
        height: 280,
      })}
    </section>

    <section class="cha-story__section" aria-labelledby="cha-section-donut">
      <h2 id="cha-section-donut" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.donut')}</h2>
      <p class="cha-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.donut')}</p>
      ${chart({
        variant: 'donut',
        label: S('donut.label'),
        categories: [S('donut.cat-1'), S('donut.cat-2'), S('donut.cat-3'), S('donut.cat-4')],
        series: [44, 28, 18, 10],
        height: 280,
      })}
    </section>

    <section class="cha-story__section" aria-labelledby="cha-section-area">
      <h2 id="cha-section-area" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.area')}</h2>
      <p class="cha-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.area')}</p>
      ${chart({
        variant: 'area',
        label: S('area.label'),
        categories: months,
        series: [
          { name: S('area.series-organic'), data: [40, 55, 70, 65, 80, 95, 110, 105] },
          { name: S('area.series-paid'), data: [20, 25, 35, 40, 50, 55, 70, 65] },
        ],
        height: 280,
      })}
    </section>

    <section class="cha-story__section" aria-labelledby="cha-section-events">
      <h2 id="cha-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="cha-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      ${chart({
        id: 'cha-events-demo',
        variant: 'bar',
        label: S('events.label'),
        categories: months.slice(0, 5),
        series: [{ name: S('events.series-name'), data: [30, 50, 35, 60, 45] }],
        height: 260,
      })}
      <div class="cha-story__log" data-events-log="cha-events-demo">
        <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-events-out class="cha-story__log-out"></div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Chart" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="cha-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="cha-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.cha-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.cha-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.cha-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.cha-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.cha-story__explainer { max-inline-size: 70ch; }
.cha-story__kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--spacing-3); }
.cha-story__kpi { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-base); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.cha-story__kpi-meta { display: grid; gap: var(--spacing-1); }
.cha-story__kpi-label { font: var(--typography-caption); color: var(--color-text-tertiary); }
.cha-story__kpi-value { font: var(--typography-h2); color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
.cha-story__kpi-trend { font: var(--typography-caption); font-variant-numeric: tabular-nums; }
.cha-story__kpi-trend[data-trend="up"] { color: var(--color-success); }
.cha-story__kpi-trend[data-trend="down"] { color: var(--color-danger); }
.cha-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.cha-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.cha-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
