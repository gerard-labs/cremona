<!--
  Tag story — 4 viewport variants (Light/Dark × LTR/RTL).
  Composes Badge envelope ; opt-in dismissable via tag-dismiss controller.

  Sections:
   1. Solid variants (6)
   2. Soft variants (6)
   3. Sizes (sm / md / lg)
   4. With leading icon
   5. Dismissable cluster (opt-in via dismissable=true)
   6. Filter pill cluster (combined dismissable + leading icon)
-->
<script setup>
import { onMounted } from 'vue';
import { Application } from '@hotwired/stimulus';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import TagDismissController from '../../../js/controllers/tag-dismiss_controller.js';

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

function renderIcon({ name, size = 'xs' }) {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] ?? ''}</span>`;
}

function renderTag({ variant = 'default', size = 'md', label, leadingIcon, soft = false, dismissable = false, dismissAria, className }) {
  const classes = ['cremona-tag'];
  if (className) classes.push(className);
  const softAttr = soft ? ' data-soft="true"' : '';
  const ctrlAttrs = dismissable ? ` data-controller="tag-dismiss" data-tag-dismiss-label-value="${label}"` : '';
  const iconSize = size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs';
  const iconHtml = leadingIcon ? renderIcon({ name: leadingIcon, size: iconSize }) : '';
  const dismissHtml = dismissable
    ? `<button type="button" class="cremona-tag__dismiss" aria-label="${dismissAria || t('theme.tag.aria.dismiss', { label })}" data-action="click->tag-dismiss#dismiss"><span aria-hidden="true">×</span></button>`
    : '';
  return `<span class="${classes.join(' ')}" data-variant="${variant}" data-size="${size}"${softAttr}${ctrlAttrs}>${iconHtml}<span class="cremona-tag__label">${label}</span>${dismissHtml}</span>`;
}

const VARIANTS = ['default', 'primary', 'success', 'warning', 'danger', 'info'];
const VARIANT_LABELS = {
  default:  t('theme.tag.story.label.default'),
  primary:  t('theme.tag.story.label.primary'),
  success:  t('theme.tag.story.label.success'),
  warning:  t('theme.tag.story.label.warning'),
  danger:   t('theme.tag.story.label.danger'),
  info:     t('theme.tag.story.label.info'),
};
const VARIANT_ICONS = {
  default: 'tag',
  primary: 'star',
  success: 'check',
  warning: 'alert-triangle',
  danger:  'alert-circle',
  info:    'info',
};

const FILTER_PILLS = [
  { variant: 'primary', soft: true, label: t('theme.tag.story.filter.javascript'), leadingIcon: 'tag' },
  { variant: 'success', soft: true, label: t('theme.tag.story.filter.typescript'), leadingIcon: 'tag' },
  { variant: 'warning', soft: true, label: t('theme.tag.story.filter.python'),     leadingIcon: 'tag' },
  { variant: 'info',    soft: true, label: t('theme.tag.story.filter.rust'),       leadingIcon: 'tag' },
  { variant: 'danger',  soft: true, label: t('theme.tag.story.filter.go'),         leadingIcon: 'tag' },
];

onMounted(() => {
  // Boot Stimulus on the document body so the dismissable tag pills wire up.
  // Idempotent — Histoire mounts variants in iframes ; if the application
  // was already started by a previous variant, Application.start re-uses it.
  if (!document.body.dataset.tagStoryBooted) {
    const app = Application.start();
    app.register('tag-dismiss', TagDismissController);
    document.body.dataset.tagStoryBooted = '1';
  }
});

const bodyHtml = `
  <section class="tag-story" data-testid="tag-root">
    <header class="tag-story__header">
      <h1>${t('theme.tag.story.title')}</h1>
      <p>${t('theme.tag.story.subtitle')}</p>
    </header>

    <section class="tag-story__section" aria-labelledby="tag-section-solid">
      <h2 id="tag-section-solid" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tag.story.section.solid')}</h2>
      <div class="tag-story__row">
        ${VARIANTS.map((v) => renderTag({ variant: v, label: VARIANT_LABELS[v] })).join('')}
      </div>
    </section>

    <section class="tag-story__section" aria-labelledby="tag-section-soft">
      <h2 id="tag-section-soft" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tag.story.section.soft')}</h2>
      <div class="tag-story__row">
        ${VARIANTS.map((v) => renderTag({ variant: v, label: VARIANT_LABELS[v], soft: true })).join('')}
      </div>
    </section>

    <section class="tag-story__section" aria-labelledby="tag-section-sizes">
      <h2 id="tag-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tag.story.section.sizes')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.tag.story.section.sizes-explainer')}</p>
      <div class="tag-story__row">
        ${renderTag({ variant: 'primary', size: 'sm', label: VARIANT_LABELS.primary })}
        ${renderTag({ variant: 'primary', size: 'md', label: VARIANT_LABELS.primary })}
        ${renderTag({ variant: 'primary', size: 'lg', label: VARIANT_LABELS.primary })}
        ${renderTag({ variant: 'success', size: 'sm', label: VARIANT_LABELS.success, leadingIcon: 'check' })}
        ${renderTag({ variant: 'success', size: 'md', label: VARIANT_LABELS.success, leadingIcon: 'check' })}
        ${renderTag({ variant: 'success', size: 'lg', label: VARIANT_LABELS.success, leadingIcon: 'check' })}
      </div>
    </section>

    <section class="tag-story__section" aria-labelledby="tag-section-icon">
      <h2 id="tag-section-icon" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tag.story.section.icon')}</h2>
      <div class="tag-story__row">
        ${VARIANTS.map((v) => renderTag({ variant: v, label: VARIANT_LABELS[v], leadingIcon: VARIANT_ICONS[v], soft: true })).join('')}
      </div>
    </section>

    <section class="tag-story__section" aria-labelledby="tag-section-dismiss">
      <h2 id="tag-section-dismiss" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tag.story.section.dismiss')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.tag.story.section.dismiss-explainer')}</p>
      <div class="tag-story__row" id="dismissable-row">
        ${VARIANTS.slice(1).map((v) => renderTag({ variant: v, soft: true, label: VARIANT_LABELS[v], dismissable: true })).join('')}
      </div>
    </section>

    <section class="tag-story__section" aria-labelledby="tag-section-filter">
      <h2 id="tag-section-filter" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tag.story.section.filter')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.tag.story.section.filter-explainer')}</p>
      <div class="tag-story__row">
        ${FILTER_PILLS.map((p) => renderTag({ ...p, dismissable: true })).join('')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Tag" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="tag-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="tag-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.tag-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.tag-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.tag-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.tag-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.tag-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-2); align-items: center; }
.tag-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
