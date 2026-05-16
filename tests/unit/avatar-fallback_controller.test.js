import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import AvatarFallbackController from '../../src/js/controllers/avatar-fallback_controller.js';
import { setTranslations, setLocale, __reset } from '../../src/js/utils/i18n.js';

/**
 * Unit tests for the Avatar primitive's `avatar-fallback` Stimulus
 * controller (the only controller introduced in Ring 1 S1.1).
 *
 * Validates:
 *  - The static initials computer (pure function, edge cases).
 *  - The DOM swap when `<img>` errors.
 *  - The `#cremona-announcer` message lands.
 *  - Initials fall back from the explicit `initials` value to the
 *    `name`-computed pair.
 */
describe('AvatarFallbackController', () => {
  let app;

  beforeEach(() => {
    __reset();
    setTranslations('fr', {
      'theme.avatar.aria.fallback': "Image d'avatar non disponible.",
      'theme.avatar.aria.fallback-named': "Image d'avatar non disponible pour {name}.",
    });
    setLocale('fr');
  });

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mount(innerHTML) {
    document.body.innerHTML = `
      <div id="cremona-announcer" aria-live="polite" aria-atomic="true"></div>
      ${innerHTML}
    `;
    app = Application.start();
    app.register('avatar-fallback', AvatarFallbackController);
    // Stimulus uses MutationObserver to connect controllers. Wait a microtask
    // tick so happy-dom can flush observer callbacks before the test acts.
    await new Promise((r) => setTimeout(r, 0));
  }

  it('static computeInitials handles empty / single-word / multi-word names', () => {
    expect(AvatarFallbackController.computeInitials('')).toBe('');
    expect(AvatarFallbackController.computeInitials(null)).toBe('');
    expect(AvatarFallbackController.computeInitials('Marie')).toBe('MA');
    expect(AvatarFallbackController.computeInitials('Marie Dupont')).toBe('MD');
    expect(AvatarFallbackController.computeInitials('Jean Pierre Dupont')).toBe('JD');
    expect(AvatarFallbackController.computeInitials('  spaced   out  ')).toBe('SO');
  });

  it('swaps <img> to fallback <span> with explicit initials on error', async () => {
    await mount(`
      <span class="cremona-avatar"
            data-controller="avatar-fallback"
            data-avatar-fallback-name-value="Marie Dupont"
            data-avatar-fallback-initials-value="MD">
        <img data-avatar-fallback-target="img"
             data-action="error->avatar-fallback#onError"
             src="https://example.test/broken.png"
             alt="Marie Dupont">
      </span>
    `);
    const img = document.querySelector('img');
    img.dispatchEvent(new Event('error'));
    await Promise.resolve();

    const span = document.querySelector('.cremona-avatar');
    expect(span.querySelector('img')).toBeNull();
    const fallback = span.querySelector('.cremona-avatar__fallback');
    expect(fallback).toBeTruthy();
    expect(fallback.textContent).toBe('MD');
    expect(fallback.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to name-computed initials when no explicit initials value', async () => {
    await mount(`
      <span class="cremona-avatar"
            data-controller="avatar-fallback"
            data-avatar-fallback-name-value="Jean Pierre Dupont">
        <img data-avatar-fallback-target="img"
             data-action="error->avatar-fallback#onError"
             src="https://example.test/x.png"
             alt="Jean Pierre Dupont">
      </span>
    `);
    document.querySelector('img').dispatchEvent(new Event('error'));
    await Promise.resolve();

    expect(document.querySelector('.cremona-avatar__fallback').textContent).toBe('JD');
  });

  it('announces the named fallback via #cremona-announcer', async () => {
    await mount(`
      <span class="cremona-avatar"
            data-controller="avatar-fallback"
            data-avatar-fallback-name-value="Marie Dupont"
            data-avatar-fallback-initials-value="MD">
        <img data-avatar-fallback-target="img"
             data-action="error->avatar-fallback#onError"
             src="bad" alt="Marie Dupont">
      </span>
    `);
    document.querySelector('img').dispatchEvent(new Event('error'));
    await Promise.resolve();

    expect(document.getElementById('cremona-announcer').textContent).toBe(
      "Image d'avatar non disponible pour Marie Dupont.",
    );
  });

  it('announces the anonymous fallback when no name value', async () => {
    await mount(`
      <span class="cremona-avatar"
            data-controller="avatar-fallback"
            data-avatar-fallback-initials-value="MD">
        <img data-avatar-fallback-target="img"
             data-action="error->avatar-fallback#onError"
             src="bad" alt="">
      </span>
    `);
    document.querySelector('img').dispatchEvent(new Event('error'));
    await Promise.resolve();

    expect(document.getElementById('cremona-announcer').textContent).toBe(
      "Image d'avatar non disponible.",
    );
  });
});
