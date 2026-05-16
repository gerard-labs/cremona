import { Controller } from '@hotwired/stimulus';

/**
 * chart — Wrapped ApexCharts adapter (Ring 2 S2.9).
 *
 * Per ADR-0012 :
 *  - ApexCharts v4.x is the underlying lib (manifest candidate-default).
 *  - **Lazy-loaded** via module-scoped dynamic `import()` mirror
 *    ADR-0011 verbatim. The lib
 *    is fetched on first chart mount per session and cached.
 *  - 5 variants out of the box : `line`, `bar`, `donut`, `area`, `sparkline`.
 *    Each variant ships its own ApexCharts options preset ; the kit's tokens
 *    flow through (foreColor, palette, grid border, motion duration).
 *  - Heatmap / sankey / treemap / funnel deferred to Ring 3+ amend with
 *    `engine: "echarts"` opt-in.
 *
 * Per WAI-ARIA :
 *  - `<figure>` wrap with `role="img"` + `aria-roledescription="graphique"`
 *    (FR) / "chart" (EN) — consumer-localized via `roleDescriptionValue` ;
 *    falls back to `t('theme.chart.aria.role-description')`.
 *  - `<figcaption>` provides the accessible name (visible) AND an
 *    `<table>` data-table fallback rendered inside an sr-only wrap so SR
 *    users hear the data even before the SVG paints.
 *  - The chart container is `<div>` with `aria-hidden="true"` (its content
 *    is the SVG, which carries no semantic value to SR — the table fallback
 *    is the source of truth).
 *
 * Stimulus value-changed guard pattern (S2.8 Stepper class-field) :
 *  - `_lastRenderedSig` class field initialized to `null` BEFORE Stimulus
 *    callbacks fire. `_renderSignature(value)` produces a deterministic
 *    string hash of the current value set ; the render path skips when the
 *    signature matches the last rendered (idempotency cache).
 *
 * Race-condition surface :
 *  - The controller may `disconnect()` during the lazy-load (consumer
 *    navigates away mid-fetch OR the dialog hosting Chart closes). The
 *    `_destroyed` flag, set on `disconnect()`, is checked in the
 *    `loadApexCharts().then()` callback so the ApexCharts instance is
 *    never created on a now-orphan element.
 *
 * Targets :
 *   container (required) — the `<div>` where ApexCharts paints the SVG.
 *
 * Values :
 *   variant         (String, default 'line')      'line' | 'bar' | 'donut' | 'area' | 'sparkline'.
 *   series          (Array,  default [])          ApexCharts series — `[{ name, data: [{x, y}|number] }, ...]`.
 *                                                  Donut variant : flat `[number, ...]`.
 *   categories      (Array,  default [])          x-axis categories (line / bar / area) or donut labels.
 *   height          (Number, default 240)         chart height in CSS pixels.
 *   locale          (String, default 'fr')        forwarded to ApexCharts `chart.defaultLocale`.
 *   roleDescription (String, default '')          aria-roledescription ; empty = fallback to i18n key.
 *
 * Events emitted (raw CustomEvent, bubbles + composed) :
 *   chart:mount             — fired in connect() before the lazy-load starts.
 *   chart:render-complete   — fired AFTER ApexCharts's first render().
 *                              detail = { variant }.
 *   chart:series-click      — fired when the user clicks a data point.
 *                              detail = { seriesIndex, dataPointIndex, value }.
 */

// Module-scoped ApexCharts cache mirror [ADR-0011] popover pattern.
let _apexCharts = null;
let _apexChartsPromise = null;

function loadApexCharts() {
  if (_apexCharts) return Promise.resolve(_apexCharts);
  if (_apexChartsPromise) return _apexChartsPromise;
  _apexChartsPromise = import('apexcharts').then((mod) => {
    _apexCharts = mod.default || mod;
    return _apexCharts;
  });
  return _apexChartsPromise;
}

/** Test-only hook : reset the module-scoped cache between tests. */
export function __resetApexChartsCache() {
  _apexCharts = null;
  _apexChartsPromise = null;
}

const VALID_VARIANTS = ['line', 'bar', 'donut', 'area', 'sparkline'];

export default class ChartController extends Controller {
  static targets = ['container'];

  static values = {
    variant: { type: String, default: 'line' },
    series: { type: Array, default: [] },
    categories: { type: Array, default: [] },
    height: { type: Number, default: 240 },
    locale: { type: String, default: 'fr' },
    roleDescription: { type: String, default: '' },
  };

  _lastRenderedSig = null;
  _instance = null;
  _destroyed = false;

  connect() {
    this._destroyed = false;
    // Sync paint : stamp ARIA + skeleton state ; the sr-only table fallback
    // is consumer-rendered in the Twig (we don't manage it from JS).
    this.element.setAttribute('data-state', 'loading');
    // Emit chart:mount synchronously so consumers can hook into the
    // pre-render phase (e.g. for loading indicators outside the chart).
    this._dispatch('chart:mount', { variant: this.variantValue });
    // Begin lazy-load + render. If the lib was previously loaded in the
    // session, this resolves synchronously to the cached module.
    this._renderChart();
  }

  disconnect() {
    this._destroyed = true;
    if (this._instance) {
      try { this._instance.destroy(); } catch { /* noop */ }
      this._instance = null;
    }
  }

  /** Wired by consumers via `data-action="<custom-event>->chart#refresh"`. */
  refresh() {
    this._lastRenderedSig = null; // invalidate idempotency cache
    this._renderChart();
  }

  // ---------- Stimulus value-changed callbacks ----------

  seriesValueChanged() { this._renderChart(); }
  categoriesValueChanged() { this._renderChart(); }
  variantValueChanged() { this._renderChart(); }
  heightValueChanged() { this._renderChart(); }
  localeValueChanged() { this._renderChart(); }

  // ---------- Internal ----------

  _renderChart() {
    if (this._destroyed) return;
    if (!this.hasContainerTarget) return;
    const sig = this._renderSignature();
    if (sig === this._lastRenderedSig) return;
    this._lastRenderedSig = sig;
    loadApexCharts().then((ApexCharts) => {
      if (this._destroyed) return;
      // Race : the controller may have been re-rendered (different sig)
      // between the load start and resolution. Skip if our sig is stale.
      if (sig !== this._lastRenderedSig) return;
      this._paintChart(ApexCharts);
    });
  }

  _paintChart(ApexCharts) {
    const options = this._buildOptions();
    if (this._instance) {
      try { this._instance.updateOptions(options); } catch { /* noop */ }
    } else {
      this._instance = new ApexCharts(this.containerTarget, options);
      try {
        const result = this._instance.render();
        if (result && typeof result.then === 'function') {
          result.then(() => this._onRenderComplete()).catch(() => this._onRenderComplete());
        } else {
          this._onRenderComplete();
        }
      } catch { this._onRenderComplete(); }
    }
  }

  _onRenderComplete() {
    if (this._destroyed) return;
    this.element.setAttribute('data-state', 'rendered');
    this._dispatch('chart:render-complete', { variant: this.variantValue });
  }

  _buildOptions() {
    const variant = VALID_VARIANTS.includes(this.variantValue) ? this.variantValue : 'line';
    const tokenStyles = getComputedStyle(this.element);
    const palette = [
      tokenStyles.getPropertyValue('--color-kpi-1').trim(),
      tokenStyles.getPropertyValue('--color-kpi-2').trim(),
      tokenStyles.getPropertyValue('--color-kpi-3').trim(),
      tokenStyles.getPropertyValue('--color-kpi-4').trim(),
      tokenStyles.getPropertyValue('--color-kpi-5').trim(),
      tokenStyles.getPropertyValue('--color-kpi-6').trim(),
    ].filter(Boolean);
    const foreColor = tokenStyles.getPropertyValue('--color-text-secondary').trim();
    const gridBorder = tokenStyles.getPropertyValue('--color-border-subtle').trim();
    const isSparkline = variant === 'sparkline';
    const isDonut = variant === 'donut';
    return {
      chart: {
        type: isSparkline ? 'line' : (isDonut ? 'donut' : variant),
        height: this.heightValue,
        defaultLocale: this.localeValue,
        toolbar: { show: false },
        sparkline: isSparkline ? { enabled: true } : undefined,
        animations: { enabled: true, speed: 180 },
        events: {
          dataPointSelection: (_event, _ctx, config) => {
            const seriesIndex = config?.seriesIndex ?? -1;
            const dataPointIndex = config?.dataPointIndex ?? -1;
            const value = this._readValue(seriesIndex, dataPointIndex);
            this._dispatch('chart:series-click', { seriesIndex, dataPointIndex, value });
          },
        },
      },
      colors: palette.length > 0 ? palette : undefined,
      series: isDonut ? this.seriesValue : this._normalizeSeries(),
      labels: isDonut ? this.categoriesValue : undefined,
      xaxis: isDonut ? undefined : { categories: this.categoriesValue },
      stroke: { width: variant === 'line' || isSparkline ? 2 : 0, curve: 'smooth' },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', labels: { colors: foreColor } },
      grid: { borderColor: gridBorder, strokeDashArray: 4 },
      tooltip: { theme: this._isDarkTheme() ? 'dark' : 'light' },
    };
  }

  _normalizeSeries() {
    const raw = this.seriesValue;
    if (!Array.isArray(raw)) return [];
    return raw.map((s, idx) => {
      if (s && typeof s === 'object' && Array.isArray(s.data)) return s;
      if (Array.isArray(s)) return { name: `Series ${idx + 1}`, data: s };
      return { name: `Series ${idx + 1}`, data: [] };
    });
  }

  _readValue(seriesIdx, pointIdx) {
    if (this.variantValue === 'donut') {
      return this.seriesValue?.[pointIdx] ?? null;
    }
    const series = this._normalizeSeries();
    const point = series?.[seriesIdx]?.data?.[pointIdx];
    if (point == null) return null;
    if (typeof point === 'object' && 'y' in point) return point.y;
    return point;
  }

  _isDarkTheme() {
    if (typeof document === 'undefined') return false;
    const root = document.documentElement;
    return root.getAttribute('data-theme') === 'dark'
      || this.element.closest('[data-theme="dark"]') != null;
  }

  _renderSignature() {
    try {
      return JSON.stringify({
        v: this.variantValue,
        s: this.seriesValue,
        c: this.categoriesValue,
        h: this.heightValue,
        l: this.localeValue,
      });
    } catch {
      return `${this.variantValue}|${Date.now()}`;
    }
  }

  _dispatch(name, detail) {
    this.element.dispatchEvent(
      new CustomEvent(name, { bubbles: true, composed: true, detail }),
    );
  }
}
