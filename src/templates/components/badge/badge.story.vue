<!--
  Badge story — 4 viewport variants. Solid × 6 variants, soft × 6 variants,
  sizes, leading-icon, count formatting (1/12/99/99+), dot-only with status.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

// Glob 30 icons (same pattern as Icon story).
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

function renderIcon({ name, size = 'xs', decorative = true, label }) {
  const classes = ['theme-icon'];
  const effDecorative = decorative || !label;
  const ariaAttrs = effDecorative
    ? 'aria-hidden="true" role="presentation"'
    : `role="img" aria-label="${label}"`;
  return `<span class="${classes.join(' ')}" data-icon="${name}" data-size="${size}" ${ariaAttrs}>${ICONS[name] ?? ''}</span>`;
}

function renderBadge({ variant = 'default', size = 'md', label, leadingIcon, count, soft = false, dot = false, className }) {
  const classes = ['theme-badge'];
  if (dot) classes.push('theme-badge--dot');
  if (className) classes.push(className);
  const softAttr = soft ? ' data-soft="true"' : '';
  if (dot) {
    return `<span class="${classes.join(' ')}" data-variant="${variant}" data-size="${size}"${softAttr} role="status" aria-label="${label ?? ''}"></span>`;
  }
  let display;
  if (count !== undefined && count !== null) {
    display = count > 99 ? '99+' : String(count);
  } else {
    display = label;
  }
  const iconHtml = leadingIcon ? renderIcon({ name: leadingIcon, size: 'xs' }) : '';
  return `<span class="${classes.join(' ')}" data-variant="${variant}" data-size="${size}"${softAttr}>${iconHtml}<span>${display}</span></span>`;
}

const VARIANTS = ['default', 'primary', 'success', 'warning', 'danger', 'info'];
const VARIANT_LABELS = {
  default:  t('theme.badge.story.label.default'),
  primary:  t('theme.badge.story.label.primary'),
  success:  t('theme.badge.story.label.success'),
  warning:  t('theme.badge.story.label.warning'),
  danger:   t('theme.badge.story.label.danger'),
  info:     t('theme.badge.story.label.info'),
};
const VARIANT_ICONS = {
  default: null,
  primary: 'star',
  success: 'check',
  warning: 'alert-triangle',
  danger:  'alert-circle',
  info:    'info',
};

const bodyHtml = `
  <section class="badge-story" data-testid="badge-root">
    <header class="badge-story__header">
      <h1>${t('theme.badge.story.title')}</h1>
      <p>${t('theme.badge.story.subtitle')}</p>
    </header>

    <section class="badge-story__section" aria-labelledby="badge-section-solid">
      <h2 id="badge-section-solid" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.badge.story.section.solid')}</h2>
      <div class="badge-story__row">
        ${VARIANTS.map((v) => renderBadge({ variant: v, label: VARIANT_LABELS[v] })).join('')}
      </div>
    </section>

    <section class="badge-story__section" aria-labelledby="badge-section-soft">
      <h2 id="badge-section-soft" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.badge.story.section.soft')}</h2>
      <div class="badge-story__row">
        ${VARIANTS.map((v) => renderBadge({ variant: v, label: VARIANT_LABELS[v], soft: true })).join('')}
      </div>
    </section>

    <section class="badge-story__section" aria-labelledby="badge-section-icon">
      <h2 id="badge-section-icon" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.badge.story.section.icon')}</h2>
      <div class="badge-story__row">
        ${VARIANTS.filter((v) => VARIANT_ICONS[v]).map((v) => renderBadge({ variant: v, label: VARIANT_LABELS[v], leadingIcon: VARIANT_ICONS[v] })).join('')}
      </div>
    </section>

    <section class="badge-story__section" aria-labelledby="badge-section-sizes">
      <h2 id="badge-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.badge.story.section.sizes')}</h2>
      <div class="badge-story__row">
        ${renderBadge({ variant: 'primary', size: 'sm', label: VARIANT_LABELS.primary })}
        ${renderBadge({ variant: 'primary', size: 'md', label: VARIANT_LABELS.primary })}
        ${renderBadge({ variant: 'success', size: 'sm', label: VARIANT_LABELS.success, leadingIcon: 'check' })}
        ${renderBadge({ variant: 'success', size: 'md', label: VARIANT_LABELS.success, leadingIcon: 'check' })}
      </div>
    </section>

    <section class="badge-story__section" aria-labelledby="badge-section-count">
      <h2 id="badge-section-count" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.badge.story.section.count')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.badge.story.count-explainer')}</p>
      <div class="badge-story__row">
        ${renderBadge({ variant: 'danger', size: 'sm', count: 1 })}
        ${renderBadge({ variant: 'danger', size: 'sm', count: 12 })}
        ${renderBadge({ variant: 'danger', size: 'sm', count: 99 })}
        ${renderBadge({ variant: 'danger', size: 'sm', count: 234 })}
      </div>
    </section>

    <section class="badge-story__section" aria-labelledby="badge-section-dot">
      <h2 id="badge-section-dot" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.badge.story.section.dot')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.badge.story.dot-explainer')}</p>
      <div class="badge-story__row">
        <div class="badge-story__dot-cell">
          ${renderBadge({ dot: true, variant: 'success', label: t('theme.badge.story.status.online') })}
          <span class="theme-typography" data-variant="caption">${t('theme.badge.story.status.online')}</span>
        </div>
        <div class="badge-story__dot-cell">
          ${renderBadge({ dot: true, variant: 'warning', label: t('theme.badge.story.status.away') })}
          <span class="theme-typography" data-variant="caption">${t('theme.badge.story.status.away')}</span>
        </div>
        <div class="badge-story__dot-cell">
          ${renderBadge({ dot: true, variant: 'danger', label: t('theme.badge.story.status.busy') })}
          <span class="theme-typography" data-variant="caption">${t('theme.badge.story.status.busy')}</span>
        </div>
        <div class="badge-story__dot-cell">
          ${renderBadge({ dot: true, variant: 'default', label: t('theme.badge.story.status.offline') })}
          <span class="theme-typography" data-variant="caption">${t('theme.badge.story.status.offline')}</span>
        </div>
      </div>
    </section>

    <section class="badge-story__section" aria-labelledby="badge-section-inline">
      <h2 id="badge-section-inline" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.badge.story.section.inline')}</h2>
      <p class="theme-typography" data-variant="body">
        <span>${t('theme.badge.story.inline-before')}</span>
        ${renderBadge({ variant: 'primary', size: 'sm', label: VARIANT_LABELS.primary })}
        <span>${t('theme.badge.story.inline-middle')}</span>
        ${renderBadge({ variant: 'success', size: 'sm', soft: true, label: VARIANT_LABELS.success, leadingIcon: 'check' })}
        <span>${t('theme.badge.story.inline-after')}</span>
      </p>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Badge" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="badge-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="badge-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.badge-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.badge-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.badge-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.badge-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.badge-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-3); align-items: center; }
.badge-story__dot-cell { display: inline-flex; align-items: center; gap: var(--spacing-2); padding: var(--spacing-2) var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); }
.badge-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
