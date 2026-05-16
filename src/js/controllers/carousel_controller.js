import { Controller } from '@hotwired/stimulus';

/**
 * carousel — slide carousel with optional autoplay + touch swipe + keyboard nav.
 *
 * Per OQ-43 (sealed S2.8 opening) :
 *  - **Autoplay OFF by default**, opt-in via `data-carousel-autoplay-interval-
 *    value=<ms>`. Pause-on-pointerenter + pause-on-focuswithin obligatoires.
 *    Skip autoplay sous `prefers-reduced-motion: reduce` via
 *    `window.matchMedia` check at `connect()` time.
 *  - **Loop direction** : back-to-first after the last slide (Stripe / Vercel /
 *    Notion pattern — mini-OQ-43a sealed). Configurable via
 *    `loop: false` to opt-out (rebound at last / first ; no cyclic).
 *  - **Pause button visible when autoplay active** (WCAG SC 2.2.2
 *    Pause/Stop/Hide). The consumer's Twig template renders the autoplay
 *    toggle button if it passes an `autoplayInterval` ; the kit's
 *    controller wires the click.
 *
 * Per WAI-ARIA APG "Carousel" :
 *  - Wrap : `role="region"` + `aria-roledescription="carousel"` + `aria-label`.
 *  - Each slide : `role="group"` + `aria-roledescription="slide"` + `aria-label`
 *    (consumer-stamped via Twig — e.g. "Slide 2 sur 5").
 *  - Slide visibility paint via `data-state="active"|"inactive"` + `aria-hidden`
 *    on inactive slides (so SR users don't traverse hidden content).
 *  - Pagination dots are native `<button>` with `aria-label` ("Slide 2 sur 5")
 *    and `aria-current="true"` on the active dot.
 *
 * Touch swipe :
 *  - pointerdown → record startX + `setPointerCapture()` for reliable events.
 *  - pointerup → compute deltaX ; if > SWIPE_THRESHOLD (50 px), advance /
 *    retreat. Otherwise no-op (no drag preview animation — keeps controller
 *    surface tight).
 *
 * Stimulus value-changed guard pattern (S2.8 Stepper class-field) :
 *  - `_lastRenderedSlide` class field initialized to `null` BEFORE Stimulus
 *    callbacks fire. `currentSlideValueChanged` skips spurious initial-fire.
 *
 * Targets :
 *   viewport (required) — the overflow:hidden frame.
 *   track    (required) — the flex row of slides (transform: translateX).
 *   slide    (required) — every slide (must have at least 1).
 *   prev / next (optional) — nav buttons.
 *   dot      (optional)   — pagination dot buttons. Each carries
 *                           `data-slide-index="N"` (0-indexed).
 *   autoplayToggle (optional) — pause/play button (rendered when autoplay).
 *
 * Values :
 *   currentSlide (Number, default 0) — 0-indexed active slide.
 *   autoplayInterval (Number, default 0) — autoplay interval in ms.
 *                                          0 = autoplay disabled.
 *   loop (Boolean, default true) — cyclic vs rebound at edges.
 *
 * Events emitted (raw CustomEvent) :
 *   carousel:slide-change — bubbles + composed.
 *                           detail = { currentSlide, previousSlide, totalSlides,
 *                                      direction: 'next' | 'prev' | 'jump' }.
 *                           Fires AFTER transition (NOT on initial render).
 */
const SWIPE_THRESHOLD = 50;

export default class CarouselController extends Controller {
  static targets = ['viewport', 'track', 'slide', 'prev', 'next', 'dot', 'autoplayToggle'];

  static values = {
    currentSlide: { type: Number, default: 0 },
    autoplayInterval: { type: Number, default: 0 },
    loop: { type: Boolean, default: true },
  };

  // Class field initialized BEFORE any Stimulus callback fires.
  _lastRenderedSlide = null;
  _autoplayTimer = null;
  _autoplayPaused = false;
  _pointerStartX = null;
  _pointerActiveId = null;

  connect() {
    // Set up listeners on the viewport (touch swipe).
    if (this.hasViewportTarget) {
      this._onPointerDown = (e) => this._handlePointerDown(e);
      this._onPointerUp = (e) => this._handlePointerUp(e);
      this._onPointerCancel = () => this._cancelPointer();
      this.viewportTarget.addEventListener('pointerdown', this._onPointerDown);
      this.viewportTarget.addEventListener('pointerup', this._onPointerUp);
      this.viewportTarget.addEventListener('pointercancel', this._onPointerCancel);
    }
    // Auto-pause autoplay on pointerenter + focusin (per OQ-43 doctrine).
    this._onPointerEnter = () => this._pauseAutoplayTransient();
    this._onPointerLeave = () => this._resumeAutoplayTransient();
    this._onFocusIn = () => this._pauseAutoplayTransient();
    this._onFocusOut = () => this._resumeAutoplayTransient();
    this.element.addEventListener('pointerenter', this._onPointerEnter);
    this.element.addEventListener('pointerleave', this._onPointerLeave);
    this.element.addEventListener('focusin', this._onFocusIn);
    this.element.addEventListener('focusout', this._onFocusOut);
    // Keyboard nav.
    this._onKeydown = (e) => this._handleKeydown(e);
    this.element.addEventListener('keydown', this._onKeydown);
    // Initial sync + autoplay start.
    this._sync();
    this._lastRenderedSlide = this.currentSlideValue;
    this._startAutoplay();
  }

  disconnect() {
    this._stopAutoplay();
    if (this.hasViewportTarget) {
      this.viewportTarget.removeEventListener('pointerdown', this._onPointerDown);
      this.viewportTarget.removeEventListener('pointerup', this._onPointerUp);
      this.viewportTarget.removeEventListener('pointercancel', this._onPointerCancel);
    }
    this.element.removeEventListener('pointerenter', this._onPointerEnter);
    this.element.removeEventListener('pointerleave', this._onPointerLeave);
    this.element.removeEventListener('focusin', this._onFocusIn);
    this.element.removeEventListener('focusout', this._onFocusOut);
    this.element.removeEventListener('keydown', this._onKeydown);
  }

  get totalSlides() {
    return this.hasSlideTarget ? this.slideTargets.length : 0;
  }

  /** Wired via `click->carousel#prev` on the prev button. */
  prev() {
    this._step(-1);
  }

  /** Wired via `click->carousel#next` on the next button. */
  next() {
    this._step(1);
  }

  /** Wired via `click->carousel#goTo` on a dot button. */
  goTo(event) {
    const idx = parseInt(event.currentTarget.dataset.slideIndex || '-1', 10);
    if (!Number.isFinite(idx) || idx < 0 || idx >= this.totalSlides) return;
    if (idx === this.currentSlideValue) return;
    this._direction = 'jump';
    this.currentSlideValue = idx;
  }

  /** Wired via `click->carousel#toggleAutoplay` on the autoplay toggle button. */
  toggleAutoplay() {
    if (this.autoplayIntervalValue <= 0) return;
    if (this._autoplayTimer) {
      this._stopAutoplay();
      this._autoplayUserPaused = true;
      this._updateAutoplayToggle();
    } else {
      this._autoplayUserPaused = false;
      this._startAutoplay();
      this._updateAutoplayToggle();
    }
  }

  /**
   * Stimulus auto-callback : restart autoplay whenever the interval value
   * changes (consumer can dynamically toggle autoplay by mutating the value,
   * AND test fixtures use this to install setInterval AFTER vi.useFakeTimers).
   * Skips initial fire (autoplay is already (re)started in `connect()`).
   */
  autoplayIntervalValueChanged(value, previous) {
    if (previous === undefined) return;
    this._stopAutoplay();
    if (value > 0) this._startAutoplay();
  }

  /** Stimulus auto-callback : re-sync DOM + dispatch on real transition. */
  currentSlideValueChanged(value, _previous) {
    if (this._lastRenderedSlide === value) return;
    this._sync();
    const isInitialFire = this._lastRenderedSlide === null;
    const prevValue = this._lastRenderedSlide;
    this._lastRenderedSlide = value;
    if (!isInitialFire) {
      const direction = this._direction || (value > prevValue ? 'next' : 'prev');
      this._direction = null;
      this._dispatch(value, prevValue, direction);
    }
  }

  /** Step by +/-1 with loop handling. */
  _step(delta) {
    const total = this.totalSlides;
    if (total === 0) return;
    let next = this.currentSlideValue + delta;
    if (this.loopValue) {
      next = (next + total) % total;
    } else {
      next = Math.max(0, Math.min(total - 1, next));
    }
    if (next === this.currentSlideValue) return;
    this._direction = delta > 0 ? 'next' : 'prev';
    this.currentSlideValue = next;
  }

  _sync() {
    const total = this.totalSlides;
    if (total === 0) return;
    const active = this.currentSlideValue;
    if (this.hasTrackTarget) {
      // Translate the track by -active * 100 % (logical inset-inline-start so
      // RTL flips naturally via CSS — actually transform translateX needs
      // explicit handling : the kit's CSS uses `--theme-carousel-translate`
      // custom prop applied as `translateX(calc(var(...) * -100%))`).
      this.trackTarget.style.setProperty('--theme-carousel-current', active);
    }
    if (this.hasSlideTarget) {
      for (let i = 0; i < this.slideTargets.length; i++) {
        const slide = this.slideTargets[i];
        const isActive = i === active;
        slide.dataset.state = isActive ? 'active' : 'inactive';
        if (isActive) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
        slide.setAttribute('tabindex', isActive ? '0' : '-1');
      }
    }
    if (this.hasDotTarget) {
      for (const dot of this.dotTargets) {
        const idx = parseInt(dot.dataset.slideIndex || '-1', 10);
        const isActive = idx === active;
        if (isActive) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
        dot.dataset.state = isActive ? 'active' : 'inactive';
      }
    }
    if (this.hasPrevTarget && !this.loopValue) {
      this.prevTarget.disabled = active === 0;
    } else if (this.hasPrevTarget) {
      this.prevTarget.disabled = false;
    }
    if (this.hasNextTarget && !this.loopValue) {
      this.nextTarget.disabled = active >= total - 1;
    } else if (this.hasNextTarget) {
      this.nextTarget.disabled = false;
    }
  }

  _handleKeydown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this._step(this._isRtl() ? 1 : -1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this._step(this._isRtl() ? -1 : 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      if (this.currentSlideValue !== 0) {
        this._direction = 'jump';
        this.currentSlideValue = 0;
      }
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = this.totalSlides - 1;
      if (last >= 0 && this.currentSlideValue !== last) {
        this._direction = 'jump';
        this.currentSlideValue = last;
      }
    }
  }

  _isRtl() {
    return typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  }

  _handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this._pointerStartX = event.clientX;
    this._pointerActiveId = event.pointerId;
    if (this.viewportTarget.setPointerCapture) {
      try { this.viewportTarget.setPointerCapture(event.pointerId); } catch { /* noop */ }
    }
  }

  _handlePointerUp(event) {
    if (this._pointerStartX === null || event.pointerId !== this._pointerActiveId) return;
    const delta = event.clientX - this._pointerStartX;
    this._cancelPointer();
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    // RTL note : in RTL, a swipe-left is "next" (the user expects the next
    // slide to come from the start side). Mirror the keyboard semantics.
    const direction = delta < 0 ? 1 : -1;
    this._step(this._isRtl() ? -direction : direction);
  }

  _cancelPointer() {
    if (this._pointerActiveId != null && this.viewportTarget?.releasePointerCapture) {
      try { this.viewportTarget.releasePointerCapture(this._pointerActiveId); } catch { /* noop */ }
    }
    this._pointerStartX = null;
    this._pointerActiveId = null;
  }

  _startAutoplay() {
    if (this.autoplayIntervalValue <= 0) return;
    if (this._autoplayUserPaused) return;
    if (this._prefersReducedMotion()) return;
    this._stopAutoplay();
    this._autoplayTimer = setInterval(() => {
      if (!this._autoplayPaused) this._step(1);
    }, this.autoplayIntervalValue);
  }

  _stopAutoplay() {
    if (this._autoplayTimer) {
      clearInterval(this._autoplayTimer);
      this._autoplayTimer = null;
    }
  }

  _pauseAutoplayTransient() {
    this._autoplayPaused = true;
  }

  _resumeAutoplayTransient() {
    this._autoplayPaused = false;
  }

  _prefersReducedMotion() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  _updateAutoplayToggle() {
    if (!this.hasAutoplayToggleTarget) return;
    const isPaused = !this._autoplayTimer;
    this.autoplayToggleTarget.dataset.state = isPaused ? 'paused' : 'playing';
    this.autoplayToggleTarget.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
  }

  _dispatch(currentSlide, previousSlide, direction) {
    this.element.dispatchEvent(
      new CustomEvent('carousel:slide-change', {
        bubbles: true,
        composed: true,
        detail: {
          currentSlide,
          previousSlide,
          totalSlides: this.totalSlides,
          direction,
        },
      }),
    );
  }
}
