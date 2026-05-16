import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

/**
 * avatar-fallback — listens for an `<img onerror>` event inside the
 * Avatar primitive and swaps the broken image for the initials block.
 *
 * Announces via the kit's shared `#theme-announcer` live region so SR
 * users hear the substitution. The substitution is invisible to AT
 * (`aria-hidden="true"` on the fallback span) — the parent Avatar still
 * carries its accessible name via the surrounding context.
 *
 * Values:
 *   name      (string) — full name used to compute initials when no
 *                        `initials` value is provided.
 *   initials  (string) — explicit initials override (1-2 chars).
 *
 * Targets:
 *   img — the <img> element whose onerror triggers the swap.
 *
 * Action:
 *   error->avatar-fallback#onError on the img element.
 */
export default class AvatarFallbackController extends Controller {
  static targets = ['img'];

  static values = {
    name: String,
    initials: String,
  };

  onError() {
    if (!this.hasImgTarget) return;
    const fallback = document.createElement('span');
    fallback.className = 'theme-avatar__fallback';
    fallback.setAttribute('aria-hidden', 'true');
    fallback.textContent = this.resolveInitials();
    this.imgTarget.replaceWith(fallback);

    const announcer = typeof document !== 'undefined'
      ? document.getElementById('theme-announcer')
      : null;
    if (announcer) {
      announcer.textContent = this.nameValue
        ? t('theme.avatar.aria.fallback-named', { name: this.nameValue })
        : t('theme.avatar.aria.fallback');
    }
  }

  resolveInitials() {
    if (this.initialsValue) return this.initialsValue.slice(0, 2).toUpperCase();
    return AvatarFallbackController.computeInitials(this.nameValue);
  }

  static computeInitials(name) {
    if (!name) return '';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
