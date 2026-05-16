import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Smoke test — the Stimulus boot exposes `start`, `boot`, `register` and
 * is idempotent on the same root.
 */
describe('theme/js/index.js — Stimulus boot', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-cremona-booted');
    document.documentElement.__themeApp = undefined;
  });

  it('exports start / boot / register / Application', async () => {
    const mod = await import('../../src/js/index.js');
    expect(typeof mod.start).toBe('function');
    expect(typeof mod.boot).toBe('function');
    expect(typeof mod.register).toBe('function');
    expect(typeof mod.Application).toBe('function');
  });

  it('boot() starts a Stimulus application and flags the root', async () => {
    const { boot } = await import('../../src/js/index.js');
    const app = boot(document.documentElement);
    expect(app).toBeTruthy();
    expect(document.documentElement.dataset.themeBooted).toBe('1');
  });

  it('boot() is idempotent — returns the same app on the same root', async () => {
    const { boot } = await import('../../src/js/index.js');
    const a = boot(document.documentElement);
    const b = boot(document.documentElement);
    expect(a).toBe(b);
  });
});
