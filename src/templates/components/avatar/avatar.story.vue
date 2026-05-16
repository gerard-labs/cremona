<!--
  Avatar story — 4 viewport variants. Sizes, image vs initials vs icon
  fallback, status dots × 4 states, hue palette × 6, loading skeleton,
  and a deliberately-broken image to demo the controller's runtime swap.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const ICON_MODULES = import.meta.glob('../../../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const ICONS = Object.fromEntries(
  Object.entries(ICON_MODULES).map(([path, raw]) => [
    path.match(/([^/]+)\.svg$/)[1],
    raw,
  ]),
);

function renderIcon({ name, size = 'lg' }) {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] ?? ''}</span>`;
}

function computeInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderAvatar({ src, alt = '', initials, name, size = 'md', status, statusLabel, hue, className }) {
  const classes = ['cremona-avatar'];
  if (status) classes.push('cremona-avatar--has-status');
  if (className) classes.push(className);
  const style = hue ? ` style="--cremona-avatar-hue: var(--color-kpi-${hue})"` : '';
  const displayInitials = initials ?? computeInitials(name);
  const showIconFallback = !src && !displayInitials;

  let body;
  if (src) {
    body = `<img class="cremona-avatar__img" data-avatar-fallback-target="img" data-action="error->avatar-fallback#onError" src="${src}" alt="${alt}">`;
  } else if (showIconFallback) {
    const iconSize = size === 'xs' || size === 'sm' ? 'sm' : (size === 'xl' ? 'xl' : 'lg');
    body = renderIcon({ name: 'user', size: iconSize });
  } else {
    body = `<span class="cremona-avatar__fallback" aria-hidden="true">${displayInitials}</span>`;
  }

  const stimulusAttrs = src
    ? `data-controller="avatar-fallback" data-avatar-fallback-name-value="${name ?? ''}" data-avatar-fallback-initials-value="${displayInitials ?? ''}"`
    : '';

  const statusHtml = status
    ? `<span class="cremona-avatar__status" data-status="${status}" role="status" aria-label="${statusLabel ?? status}"></span>`
    : '';

  return `<span class="${classes.join(' ')}" data-size="${size}" ${stimulusAttrs}${style}>${body}${statusHtml}</span>`;
}

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
const STATUSES = ['online', 'away', 'busy', 'offline'];
// A 1×1 transparent pixel data URL — keeps the loaded-image variant deterministic
// without needing a network fetch for the visual baselines.
const TEAL_PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const bodyHtml = `
  <section class="avatar-story" data-testid="avatar-root">
    <header class="avatar-story__header">
      <h1>${t('theme.avatar.story.title')}</h1>
      <p>${t('theme.avatar.story.subtitle')}</p>
    </header>

    <section class="avatar-story__section" aria-labelledby="avatar-section-sizes">
      <h2 id="avatar-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar.story.section.sizes')}</h2>
      <div class="avatar-story__row">
        ${SIZES.map((s) => `
          <div class="avatar-story__cell">
            ${renderAvatar({ name: 'Marie Dupont', initials: 'MD', size: s, hue: 1 })}
            <code class="avatar-story__cellname">${s}</code>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="avatar-story__section" aria-labelledby="avatar-section-image">
      <h2 id="avatar-section-image" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar.story.section.image')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.avatar.story.image-explainer')}</p>
      <div class="avatar-story__row">
        ${renderAvatar({ src: TEAL_PIXEL_PNG, alt: 'Marie Dupont', initials: 'MD', name: 'Marie Dupont', size: 'lg' })}
      </div>
    </section>

    <section class="avatar-story__section" aria-labelledby="avatar-section-initials">
      <h2 id="avatar-section-initials" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar.story.section.initials')}</h2>
      <div class="avatar-story__row">
        ${renderAvatar({ name: 'Marie Dupont',   initials: 'MD', size: 'lg', hue: 1 })}
        ${renderAvatar({ name: 'Jean Pierre',    initials: 'JP', size: 'lg', hue: 2 })}
        ${renderAvatar({ name: 'Sara Karim',     initials: 'SK', size: 'lg', hue: 3 })}
        ${renderAvatar({ name: 'Tom Wright',     initials: 'TW', size: 'lg', hue: 4 })}
        ${renderAvatar({ name: 'Yuki Tanaka',    initials: 'YT', size: 'lg', hue: 5 })}
        ${renderAvatar({ name: 'Adel Bouhassoun', initials: 'AB', size: 'lg', hue: 6 })}
      </div>
    </section>

    <section class="avatar-story__section" aria-labelledby="avatar-section-icon-fallback">
      <h2 id="avatar-section-icon-fallback" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar.story.section.icon-fallback')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.avatar.story.icon-fallback-explainer')}</p>
      <div class="avatar-story__row">
        ${renderAvatar({ size: 'lg' })}
      </div>
    </section>

    <section class="avatar-story__section" aria-labelledby="avatar-section-status">
      <h2 id="avatar-section-status" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar.story.section.status')}</h2>
      <div class="avatar-story__row">
        ${STATUSES.map((s) => `
          <div class="avatar-story__cell">
            ${renderAvatar({ name: 'Marie Dupont', initials: 'MD', size: 'lg', hue: 1, status: s, statusLabel: t(`theme.avatar.status.${s}`) })}
            <code class="avatar-story__cellname">${s}</code>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="avatar-story__section" aria-labelledby="avatar-section-broken">
      <h2 id="avatar-section-broken" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar.story.section.broken')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.avatar.story.broken-explainer')}</p>
      <div class="avatar-story__row">
        ${renderAvatar({
          src: 'https://example.invalid/missing-avatar.png',
          alt: 'Camille Petit',
          initials: 'CP',
          name: 'Camille Petit',
          size: 'lg',
          hue: 4,
          status: 'busy',
          statusLabel: t('theme.avatar.status.busy'),
        })}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Avatar" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="avatar-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="avatar-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.avatar-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.avatar-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.avatar-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.avatar-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.avatar-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: end; }
.avatar-story__cell { display: grid; gap: var(--spacing-1); justify-items: center; }
.avatar-story__cellname { font: var(--typography-code); color: var(--color-text-tertiary); }
.avatar-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
