/**
 * sonner-viewport.js — idempotent viewport DOM injector for the Sonner
 * compound (Ring 2 S2.5).
 *
 * The Sonner toasts engine needs a single fixed-position <aside> at the
 * bottom-end of the viewport, with `data-controller="sonner"` so Stimulus
 * connects the SonnerController and the document-level
 * `theme:toast:show` event handler is registered.
 *
 * Doctrine:
 *   - **Singleton** — multiple calls to ensureSonnerViewport() leave the
 *     DOM in the same state. Idempotent.
 *   - **Body-anchored** — viewport appended directly to `document.body`,
 *     not to any consumer-owned container. Toasts stay above page
 *     content via `z-index: var(--z-toast)`.
 *   - **No `t()` dependency** — runs before translations may be loaded
 *     (boot() calls this). aria-label uses the i18n key as fallback ;
 *     if a translation is already loaded the consumer can swap the
 *     attribute post-boot or re-call this helper after setLocale().
 *
 * Wired data-actions on the viewport:
 *   - `pointerenter->sonner#pauseAll`   pause every visible toast's timer
 *   - `pointerleave->sonner#resumeAll`  resume with remaining time
 *   - `keydown.esc@window->sonner#dismissAll` Esc dismisses everything
 *
 * The queue indicator button (initially hidden) is a child of the
 * viewport ; the SonnerController toggles its visibility + label as the
 * queue grows / shrinks via Intl.PluralRules-resolved `t('theme.sonner.
 * queue-more', { count })`.
 */

import { t } from './i18n.js';

const VIEWPORT_SELECTOR = 'aside.cremona-sonner__viewport[data-controller~="sonner"]';

/**
 * Ensure a Sonner viewport exists in document.body. Idempotent — if a
 * viewport is already in DOM, returns it unchanged.
 *
 * @returns {HTMLElement | null} the viewport element, or null in
 *                               non-browser environments (SSR).
 */
export function ensureSonnerViewport() {
  if (typeof document === 'undefined' || !document.body) return null;

  const existing = document.querySelector(VIEWPORT_SELECTOR);
  if (existing) return existing;

  const viewport = document.createElement('aside');
  viewport.className = 'cremona-sonner__viewport';
  viewport.setAttribute('aria-label', t('theme.sonner.aria.viewport'));
  viewport.setAttribute('data-controller', 'sonner');
  viewport.setAttribute(
    'data-action',
    [
      'pointerenter->sonner#pauseAll',
      'pointerleave->sonner#resumeAll',
      'keydown.esc@window->sonner#dismissAll',
    ].join(' '),
  );

  const indicator = document.createElement('button');
  indicator.type = 'button';
  indicator.className = 'cremona-sonner__queue-indicator';
  indicator.setAttribute('data-action', 'click->sonner#expandQueue');
  indicator.setAttribute('data-sonner-target', 'indicator');
  indicator.hidden = true;
  viewport.appendChild(indicator);

  document.body.appendChild(viewport);
  return viewport;
}
