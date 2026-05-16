<!--
  Alert story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · variants-soft · variants-solid · full-anatomy
                · no-icon · long-content.

  Doctrine:
    - 4 status variants (info / warning / danger / success) × 2 tones (soft / solid).
    - Exercises the full *-foreground × * + *-soft-foreground × *-soft matrix
      (already asserted in tools/check-tokens.js — no new pairs introduced).
    - Default icon per variant (info / alert-triangle / alert-circle / check)
      via the Twig template's _iconMap. Story renders the same map manually
      since stories don't go through Twig.
    - role="alert" on danger (assertive aria-live), role="status" otherwise
      (polite aria-live) — derived from variant.
    - Dismiss is a controller `alert-dismiss` (~12 lines effective). Animation
      appear 180 ms emphasized fade+translateY; dismiss 120 ms accelerate
      opacity fade then remove from DOM + announce.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import infoSvg          from '../../../assets/icons/info.svg?raw';
import alertTriangleSvg from '../../../assets/icons/alert-triangle.svg?raw';
import alertCircleSvg   from '../../../assets/icons/alert-circle.svg?raw';
import checkSvg         from '../../../assets/icons/check.svg?raw';
import xSvg             from '../../../assets/icons/x.svg?raw';

const ICONS = {
  info: infoSvg,
  'alert-triangle': alertTriangleSvg,
  'alert-circle': alertCircleSvg,
  check: checkSvg,
  x: xSvg,
};

const ICON_MAP = {
  info: 'info',
  warning: 'alert-triangle',
  danger: 'alert-circle',
  success: 'check',
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

let _alertCounter = 0;
function nextId() { return `alert-${++_alertCounter}`; }

function icon(name, size = 'md') {
  return `<span class="theme-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderAlert({
  variant = 'info',
  tone = 'soft',
  title = null,
  body = null,
  bodyHtml = null,
  hideIcon = false,
  iconOverride = null,
  dismissible = false,
  dismissAriaLabel = null,
  dismissMessage = 'theme.alert.aria.dismissed',
  actionHtml = null,
}) {
  const id = nextId();
  const role = variant === 'danger' ? 'alert' : 'status';
  const iconName = iconOverride ?? ICON_MAP[variant];
  const iconBlock = hideIcon
    ? ''
    : `<span class="theme-icon theme-alert__icon" data-icon="${iconName}" data-size="md" aria-hidden="true" role="presentation">${ICONS[iconName] || ''}</span>`;
  const titleBlock = title ? `<p class="theme-alert__title">${title}</p>` : '';
  const bodyBlock = bodyHtml
    ? `<div class="theme-alert__body">${bodyHtml}</div>`
    : body
      ? `<div class="theme-alert__body"><p>${body}</p></div>`
      : '';
  const actionBlock = actionHtml ? `<div class="theme-alert__actions">${actionHtml}</div>` : '';
  const dismissBlock = dismissible
    ? `<button type="button" class="theme-alert__dismiss" aria-label="${dismissAriaLabel}" data-action="click->alert-dismiss#dismiss">${icon('x', 'sm')}</button>`
    : '';
  const ctrlAttrs = dismissible
    ? `data-controller="alert-dismiss" data-alert-dismiss-message-value="${dismissMessage}"`
    : '';
  return `
    <div class="theme-alert" id="${id}" role="${role}" data-variant="${variant}" data-tone="${tone}" ${ctrlAttrs}>
      ${iconBlock}
      <div class="theme-alert__content">
        ${titleBlock}
        ${bodyBlock}
        ${actionBlock}
      </div>
      ${dismissBlock}
    </div>
  `;
}

function row(html, label) {
  return `
    <div class="alert-story__row">
      ${label ? `<code class="alert-story__rowlabel">${label}</code>` : ''}
      <div class="alert-story__rowcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  infoTitle:    t('theme.alert.story.sample.info-title'),
  infoBody:     t('theme.alert.story.sample.info-body'),
  warningTitle: t('theme.alert.story.sample.warning-title'),
  warningBody:  t('theme.alert.story.sample.warning-body'),
  dangerTitle:  t('theme.alert.story.sample.danger-title'),
  dangerBody:   t('theme.alert.story.sample.danger-body'),
  successTitle: t('theme.alert.story.sample.success-title'),
  successBody:  t('theme.alert.story.sample.success-body'),
  fullTitle:    t('theme.alert.story.sample.full-title'),
  fullBodyP1:   t('theme.alert.story.sample.full-body-p1'),
  fullBodyP2:   t('theme.alert.story.sample.full-body-p2'),
  noIconBody:   t('theme.alert.story.sample.no-icon-body'),
  longP1:       t('theme.alert.story.sample.long-p1'),
  longP2:       t('theme.alert.story.sample.long-p2'),
  longP3:       t('theme.alert.story.sample.long-p3'),
  actionFinalize: t('theme.alert.story.sample.action-finalize'),
  actionRetry:    t('theme.alert.story.sample.action-retry'),
  ariaDismiss:    t('theme.alert.aria.dismiss'),
};

function actionButton(label) {
  return `<button type="button" class="theme-button" data-variant="ghost" data-size="sm"><span class="theme-button__label">${label}</span></button>`;
}

const bodyHtml = `
  <section class="alert-story" data-testid="alert-root">
    <header class="alert-story__header">
      <h1>${t('theme.alert.story.title')}</h1>
      <p>${t('theme.alert.story.subtitle')}</p>
    </header>

    <section class="alert-story__section" aria-labelledby="alert-section-default">
      <h2 id="alert-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.alert.story.section.default')}</h2>
      <p class="alert-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.alert.story.explainer.default')}</p>
      <div class="alert-story__stack">
        ${row(renderAlert({ variant: 'info', tone: 'soft', body: SAMPLES.infoBody }), 'info soft (body only)')}
      </div>
    </section>

    <section class="alert-story__section" aria-labelledby="alert-section-variants">
      <h2 id="alert-section-variants" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.alert.story.section.variants')}</h2>
      <p class="alert-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.alert.story.explainer.variants')}</p>
      <div class="alert-story__stack">
        ${row(renderAlert({ variant: 'info',    tone: 'soft', title: SAMPLES.infoTitle,    body: SAMPLES.infoBody }),    'info soft')}
        ${row(renderAlert({ variant: 'warning', tone: 'soft', title: SAMPLES.warningTitle, body: SAMPLES.warningBody }), 'warning soft')}
        ${row(renderAlert({ variant: 'danger',  tone: 'soft', title: SAMPLES.dangerTitle,  body: SAMPLES.dangerBody }),  'danger soft')}
        ${row(renderAlert({ variant: 'success', tone: 'soft', title: SAMPLES.successTitle, body: SAMPLES.successBody }), 'success soft')}
      </div>
    </section>

    <section class="alert-story__section" aria-labelledby="alert-section-tones">
      <h2 id="alert-section-tones" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.alert.story.section.tones')}</h2>
      <p class="alert-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.alert.story.explainer.tones')}</p>
      <div class="alert-story__stack">
        ${row(renderAlert({ variant: 'info',    tone: 'solid', title: SAMPLES.infoTitle,    body: SAMPLES.infoBody }),    'info solid')}
        ${row(renderAlert({ variant: 'warning', tone: 'solid', title: SAMPLES.warningTitle, body: SAMPLES.warningBody }), 'warning solid')}
        ${row(renderAlert({ variant: 'danger',  tone: 'solid', title: SAMPLES.dangerTitle,  body: SAMPLES.dangerBody }),  'danger solid')}
        ${row(renderAlert({ variant: 'success', tone: 'solid', title: SAMPLES.successTitle, body: SAMPLES.successBody }), 'success solid')}
      </div>
    </section>

    <section class="alert-story__section" aria-labelledby="alert-section-full-anatomy">
      <h2 id="alert-section-full-anatomy" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.alert.story.section.full-anatomy')}</h2>
      <p class="alert-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.alert.story.explainer.full-anatomy')}</p>
      <div class="alert-story__stack">
        ${row(renderAlert({
          variant: 'warning',
          tone: 'soft',
          title: SAMPLES.fullTitle,
          bodyHtml: `<p>${SAMPLES.fullBodyP1}</p><p>${SAMPLES.fullBodyP2}</p>`,
          dismissible: true,
          dismissAriaLabel: SAMPLES.ariaDismiss,
          actionHtml: actionButton(SAMPLES.actionFinalize),
        }), 'warning soft · icon + title + body + action + dismiss')}
        ${row(renderAlert({
          variant: 'danger',
          tone: 'soft',
          title: SAMPLES.dangerTitle,
          body: SAMPLES.dangerBody,
          dismissible: true,
          dismissAriaLabel: SAMPLES.ariaDismiss,
          actionHtml: actionButton(SAMPLES.actionRetry),
        }), 'danger soft · role="alert" + action + dismiss')}
      </div>
    </section>

    <section class="alert-story__section" aria-labelledby="alert-section-no-icon">
      <h2 id="alert-section-no-icon" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.alert.story.section.no-icon')}</h2>
      <p class="alert-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.alert.story.explainer.no-icon')}</p>
      <div class="alert-story__stack">
        ${row(renderAlert({ variant: 'info', tone: 'soft', hideIcon: true, body: SAMPLES.noIconBody }), 'info soft · hideIcon')}
      </div>
    </section>

    <section class="alert-story__section" aria-labelledby="alert-section-long-content">
      <h2 id="alert-section-long-content" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.alert.story.section.long-content')}</h2>
      <p class="alert-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.alert.story.explainer.long-content')}</p>
      <div class="alert-story__stack">
        ${row(renderAlert({
          variant: 'info',
          tone: 'soft',
          bodyHtml: `<p>${SAMPLES.longP1}</p><p>${SAMPLES.longP2}</p><p>${SAMPLES.longP3}</p>`,
        }), 'info soft · 3 paragraphes (+30 % FR)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Alert" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="alert-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="alert-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.alert-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.alert-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.alert-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.alert-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.alert-story__stack { display: grid; gap: var(--spacing-3); }
.alert-story__row { display: grid; grid-template-columns: minmax(200px, 260px) 1fr; gap: var(--spacing-3); align-items: start; }
.alert-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.alert-story__rowcontent { min-inline-size: 0; max-inline-size: 640px; }
.alert-story__explainer { max-inline-size: 70ch; }
.alert-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
