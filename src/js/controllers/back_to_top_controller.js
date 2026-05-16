/**
 * back_to_top_controller.js — Floating back-to-top button (Ring 3 S3.2).
 *
 * Listens to window scroll. Reveals the button when window.scrollY exceeds
 * `threshold` (default 400 px). Click → smooth scroll to top.
 *
 * Honors prefers-reduced-motion : skips smooth scroll behavior (jumps instantly).
 *
 * Events (bubbles + composed) :
 *   back-to-top:show
 *   back-to-top:hide
 *   back-to-top:click
 */

import { Controller } from '@hotwired/stimulus';

export default class BackToTopController extends Controller {
  static values = {
    threshold: { type: Number, default: 400 },
  };

  connect() {
    this._destroyed = false;
    this._visible = false;
    // Stamp the initial (hidden) state — `_handleScroll` only writes the
    // attribute on a *change*, so a page that starts below the threshold
    // would otherwise never get `data-visible` stamped at all.
    this.element.setAttribute('data-visible', 'false');
    this._onScroll = this._handleScroll.bind(this);
    window.addEventListener('scroll', this._onScroll, { passive: true });
    // Initial state — in case the page is already scrolled.
    this._handleScroll();
  }

  disconnect() {
    this._destroyed = true;
    window.removeEventListener('scroll', this._onScroll);
  }

  _handleScroll() {
    if (this._destroyed) return;
    const shouldShow = window.scrollY > this.thresholdValue;
    if (shouldShow === this._visible) return;
    this._visible = shouldShow;
    this.element.setAttribute('data-visible', shouldShow ? 'true' : 'false');
    this.element.dispatchEvent(
      new CustomEvent(shouldShow ? 'back-to-top:show' : 'back-to-top:hide', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Wired via `data-action="click->back-to-top#scrollToTop"`. */
  scrollToTop(event) {
    event.preventDefault();
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    this.element.dispatchEvent(
      new CustomEvent('back-to-top:click', { bubbles: true, composed: true }),
    );
  }
}
