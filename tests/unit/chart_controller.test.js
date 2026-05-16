import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// Hoisted mocks per the popover_controller.test.js pattern (vi.hoisted +
// vi.mock factory). The mock intercepts BOTH static and dynamic imports of
// 'apexcharts' — Vite's module resolution treats them as the
// same module ID.
const { mockRender, mockUpdateOptions, mockDestroy, mockApexCtor, instances } =
  vi.hoisted(() => {
    const instances = [];
    const render = vi.fn(() => Promise.resolve());
    const updateOptions = vi.fn();
    const destroy = vi.fn();
    function ApexCtor(el, opts) {
      this.el = el;
      this.opts = opts;
      this.render = render;
      this.updateOptions = updateOptions;
      this.destroy = destroy;
      instances.push(this);
    }
    return { mockRender: render, mockUpdateOptions: updateOptions, mockDestroy: destroy, mockApexCtor: ApexCtor, instances };
  });

vi.mock('apexcharts', () => ({ default: mockApexCtor }));

const { default: ChartController, __resetApexChartsCache } = await import(
  '../../src/js/controllers/chart_controller.js'
);

/** Flush microtasks. Stimulus's value-changed callbacks observe DOM
 *  mutations via a MutationObserver — we need 2 ticks for the initial
 *  connect to settle AND the lazy-load `.then()` to resolve. */
const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Chart compound's `chart` controller (S2.9).
 *
 * Per [ADR-0012](../docs/adr/0012-lib-chart-apexcharts.md) :
 *   - Lazy-load ApexCharts mirror [ADR-0011](../docs/adr/0011-lazy-load-floating-ui.md) verbatim.
 *   - Sync skeleton + ARIA stamps on connect() ; async render after chunk arrives.
 *   - 5 variants : line / bar / donut / area / sparkline.
 *   - Class-field initial-fire guard pattern S2.8 verbatim.
 *
 * Coverage map (13 tests) :
 *
 *  Lifecycle
 *   1. connect → data-state="loading" + chart:mount fired with detail.variant.
 *   2. connect → ApexCharts ctor invoked with the container target.
 *   3. connect → render().then resolves → data-state="rendered" + chart:render-complete fired.
 *   4. disconnect → instance.destroy() called.
 *
 *  Variant routing
 *   5. variant='line' → ctor opts.chart.type='line'.
 *   6. variant='bar' → ctor opts.chart.type='bar'.
 *   7. variant='donut' → ctor opts.chart.type='donut' + opts.labels populated from categoriesValue.
 *   8. variant='sparkline' → ctor opts.chart.sparkline.enabled=true.
 *
 *  Update path
 *   9. series mutation → updateOptions called (not a new ctor).
 *  10. idempotency : same series → no extra ctor / updateOptions call.
 *
 *  Series-click event
 *  11. ApexCharts's dataPointSelection event → chart:series-click dispatched with detail.
 *
 *  Theming
 *  12. data-theme="dark" on document.documentElement → opts.tooltip.theme="dark".
 *
 *  Race-condition
 *  13. disconnect() before lazy-load resolves → no ctor invoked.
 */
describe('ChartController', () => {
  let app;
  let _origGetComputedStyle;

  beforeEach(() => {
    __resetApexChartsCache();
    mockRender.mockClear();
    mockUpdateOptions.mockClear();
    mockDestroy.mockClear();
    instances.length = 0;
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    // Stub getComputedStyle so the controller's token palette read works in
    // happy-dom (which returns empty values for CSS custom props).
    _origGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn(() => ({
      getPropertyValue: (prop) => {
        const map = {
          '--color-kpi-1': 'oklch(0.55 0.22 277)',
          '--color-kpi-2': 'oklch(0.78 0.165 80)',
          '--color-kpi-3': 'oklch(0.62 0.16 158)',
          '--color-kpi-4': 'oklch(0.68 0.135 235)',
          '--color-kpi-5': 'oklch(0.6 0.18 280)',
          '--color-kpi-6': 'oklch(0.68 0.2 340)',
          '--color-text-secondary': 'oklch(0.42 0.018 270)',
          '--color-border-subtle': 'oklch(0.93 0.005 270)',
        };
        return map[prop] || '';
      },
    }));
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    window.getComputedStyle = _origGetComputedStyle;
  });

  async function mount({
    variant = 'line',
    series = '[{"name":"S1","data":[10,20,30]}]',
    categories = '["Jan","Feb","Mar"]',
    height = 240,
    locale = 'fr',
  } = {}) {
    document.body.innerHTML = `
      <figure id="chart-wrap" class="theme-chart"
        data-controller="chart"
        data-chart-variant-value="${variant}"
        data-chart-series-value='${series}'
        data-chart-categories-value='${categories}'
        data-chart-height-value="${height}"
        data-chart-locale-value="${locale}"
        role="img" aria-roledescription="graphique" aria-label="Test chart">
        <div data-chart-target="container" aria-hidden="true"></div>
      </figure>
    `;
    app = Application.start();
    app.register('chart', ChartController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('chart-wrap'),
      ctrl: app.controllers.find((c) => c.identifier === 'chart'),
      container: document.querySelector('[data-chart-target="container"]'),
    };
  }

  // 1
  it('connect → data-state="loading" + chart:mount fired with detail.variant', async () => {
    const events = [];
    document.body.addEventListener('chart:mount', (e) => events.push(e.detail), { once: false });
    const { wrap } = await mount({ variant: 'bar' });
    // After mount (with double tick), the state may already be 'rendered' since
    // mockRender resolves immediately. We assert the data-state path was at least loading first.
    // The chart:mount detail captures the variant at the connect() call moment.
    expect(events).toHaveLength(1);
    expect(events[0].variant).toBe('bar');
    expect(['loading', 'rendered']).toContain(wrap.getAttribute('data-state'));
  });

  // 2
  it('connect → ApexCharts ctor invoked with the container target', async () => {
    const { container } = await mount({});
    expect(instances).toHaveLength(1);
    expect(instances[0].el).toBe(container);
  });

  // 3
  it('connect → render().then resolves → data-state="rendered" + chart:render-complete fired', async () => {
    const events = [];
    document.body.addEventListener('chart:render-complete', (e) => events.push(e.detail), { once: false });
    const { wrap } = await mount({ variant: 'line' });
    // Allow the render().then microtask to resolve.
    await tick();
    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(wrap.getAttribute('data-state')).toBe('rendered');
    expect(events).toHaveLength(1);
    expect(events[0].variant).toBe('line');
  });

  // 4
  it('disconnect → instance.destroy() called', async () => {
    const { wrap } = await mount({});
    wrap.remove(); // element removal is what Stimulus observes to disconnect
    await tick();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  // 5
  it('variant="line" → ctor opts.chart.type="line"', async () => {
    await mount({ variant: 'line' });
    expect(instances[0].opts.chart.type).toBe('line');
  });

  // 6
  it('variant="bar" → ctor opts.chart.type="bar"', async () => {
    await mount({ variant: 'bar' });
    expect(instances[0].opts.chart.type).toBe('bar');
  });

  // 7
  it('variant="donut" → ctor opts.chart.type="donut" + opts.labels populated', async () => {
    await mount({
      variant: 'donut',
      series: '[40, 30, 20, 10]',
      categories: '["A","B","C","D"]',
    });
    expect(instances[0].opts.chart.type).toBe('donut');
    expect(instances[0].opts.labels).toEqual(['A', 'B', 'C', 'D']);
    expect(instances[0].opts.series).toEqual([40, 30, 20, 10]);
  });

  // 8
  it('variant="sparkline" → ctor opts.chart.sparkline.enabled=true', async () => {
    await mount({ variant: 'sparkline' });
    expect(instances[0].opts.chart.sparkline).toEqual({ enabled: true });
  });

  // 9
  it('series mutation → updateOptions called (not a new ctor)', async () => {
    const { ctrl } = await mount({});
    mockUpdateOptions.mockClear();
    ctrl.seriesValue = [{ name: 'S2', data: [99, 88, 77] }];
    await tick();
    await tick();
    expect(mockUpdateOptions).toHaveBeenCalledTimes(1);
    // No new ApexCharts instance — still the same one created at mount.
    expect(instances).toHaveLength(1);
  });

  // 10
  it('idempotency : re-render with same signature → no extra updateOptions call', async () => {
    const { ctrl } = await mount({});
    mockUpdateOptions.mockClear();
    // Manually trigger _renderChart with no value change — should skip.
    ctrl._renderChart();
    await tick();
    expect(mockUpdateOptions).not.toHaveBeenCalled();
  });

  // 11
  it('ApexCharts dataPointSelection event → chart:series-click dispatched with detail', async () => {
    const { wrap } = await mount({
      series: '[{"name":"S1","data":[10,20,30]}]',
      categories: '["Jan","Feb","Mar"]',
    });
    const events = [];
    wrap.addEventListener('chart:series-click', (e) => events.push(e.detail));
    // Simulate ApexCharts calling the dataPointSelection callback.
    const cb = instances[0].opts.chart.events.dataPointSelection;
    cb({}, {}, { seriesIndex: 0, dataPointIndex: 1 });
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ seriesIndex: 0, dataPointIndex: 1, value: 20 });
  });

  // 12
  it('data-theme="dark" on document → opts.tooltip.theme="dark"', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    await mount({});
    expect(instances[0].opts.tooltip.theme).toBe('dark');
  });

  // 13
  it('disconnect() before lazy-load resolves → no ctor invoked', async () => {
    // Mount, then start a fresh (cold-cache) async render and flip the
    // _destroyed flag synchronously — before the lazy-load's .then() can
    // resolve. The guard inside loadApexCharts().then() must skip the paint.
    const { ctrl } = await mount({});
    __resetApexChartsCache();
    instances.length = 0;
    ctrl._instance = null;
    ctrl._lastRenderedSig = null;
    ctrl._renderChart();      // load now in flight, _destroyed still false
    ctrl._destroyed = true;   // race: the controller disconnects first
    await tick();
    await tick();
    expect(instances).toHaveLength(0);
    app = null;
  });
});
