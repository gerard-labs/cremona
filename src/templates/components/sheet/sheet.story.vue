<!--
  Sheet story — 4 viewport variants (Light/Dark × LTR/RTL).

  Per OQ-26 doctrine: responsive pivot at 768 px. The story is rendered
  at the standard Histoire viewports (mobile + desktop captured); resize
  the page below 768 px in dev to see the auto-bottom-sheet behavior on
  any edge configuration.

  Sections (5):
    1. Default (edge=end → mobile auto-bottom-sheet)
    2. 4 edges (desktop behavior; mobile = bottom-sheet for all)
    3. With form (action sheet pattern — short list of actions)
    4. Long content (internal vertical scroll, mobile capped at 85dvh)
    5. Events log (sheet:open + detail.edge, sheet:close)
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import xSvg from '../../../assets/icons/x.svg?raw';
import bellSvg from '../../../assets/icons/bell.svg?raw';
import editSvg from '../../../assets/icons/edit-3.svg?raw';
import infoSvg from '../../../assets/icons/info.svg?raw';
import menuSvg from '../../../assets/icons/menu.svg?raw';
import trashSvg from '../../../assets/icons/trash-2.svg?raw';

const ICONS = {
  x: xSvg, bell: bellSvg, 'edit-3': editSvg, info: infoSvg, menu: menuSvg, 'trash-2': trashSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  if (typeof document !== 'undefined' && !window.__themeSheetLogWired) {
    window.__themeSheetLogWired = true;
    document.addEventListener('sheet:open', (e) => {
      const log = document.querySelector('[data-sheet-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') { log.textContent = ''; log.dataset.empty = '0'; }
      const edge = e.detail && e.detail.edge ? ` (edge=${e.detail.edge})` : '';
      log.textContent += `sheet:open${edge}\n`;
    });
    document.addEventListener('sheet:close', () => {
      const log = document.querySelector('[data-sheet-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') { log.textContent = ''; log.dataset.empty = '0'; }
      log.textContent += 'sheet:close\n';
    });
  }
});

let _shCounter = 0;
function nextId() { return `sh-${++_shCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="theme-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function triggerButton(label, opts = {}) {
  const { variant = 'primary', size = 'md', iconLeading = null } = opts;
  const leadingHtml = iconLeading ? `<span class="theme-button__icon theme-button__icon--leading">${icon(iconLeading)}</span>` : '';
  return `<button type="button" class="theme-button" data-variant="${variant}" data-size="${size}"
    data-action="click->sheet#open">
    ${leadingHtml}<span class="theme-button__label">${label}</span>
  </button>`;
}

function closeXButton(ariaLabel) {
  return `<button type="button" class="theme-button theme-sheet__close" data-variant="ghost" data-size="sm"
    aria-label="${ariaLabel}" data-action="click->sheet#close">${icon('x')}</button>`;
}

function renderSheet({
  edge = 'end',
  trigger,
  title,
  body,
  footer = '',
  closeOnEscape = true,
  closeOnBackdropClick = true,
  showHandle = true,
  showCloseButton = true,
}) {
  const id = nextId();
  const titleId = `${id}-title`;
  return `
    <div class="theme-sheet-wrap"
      data-controller="sheet"
      data-sheet-open-value="false"
      data-sheet-edge-value="${edge}"
      data-sheet-close-on-escape-value="${closeOnEscape}"
      data-sheet-close-on-backdrop-click-value="${closeOnBackdropClick}">
      ${trigger}
      <dialog id="${id}" class="theme-sheet"
        data-sheet-target="dialog"
        data-edge="${edge}"
        aria-labelledby="${titleId}">
        ${showHandle ? '<span class="theme-sheet__handle" aria-hidden="true"></span>' : ''}
        <header class="theme-sheet__header">
          <h2 id="${titleId}" class="theme-sheet__title">${title}</h2>
          ${showCloseButton ? closeXButton(S.ariaClose) : ''}
        </header>
        <div class="theme-sheet__body">${body}</div>
        ${footer ? `<footer class="theme-sheet__footer">${footer}</footer>` : ''}
      </dialog>
    </div>
  `;
}

const S = {
  defTrig: t('theme.sheet.story.sample.default-trigger'),
  defTitle: t('theme.sheet.story.sample.default-title'),
  defBody: t('theme.sheet.story.sample.default-body'),
  defCancel: t('theme.sheet.story.sample.default-cancel'),
  defConfirm: t('theme.sheet.story.sample.default-confirm'),
  edgeTrigStart: t('theme.sheet.story.sample.edges-trigger-start'),
  edgeTrigEnd: t('theme.sheet.story.sample.edges-trigger-end'),
  edgeTrigTop: t('theme.sheet.story.sample.edges-trigger-top'),
  edgeTrigBottom: t('theme.sheet.story.sample.edges-trigger-bottom'),
  edgeTitleStart: t('theme.sheet.story.sample.edges-title-start'),
  edgeTitleEnd: t('theme.sheet.story.sample.edges-title-end'),
  edgeTitleTop: t('theme.sheet.story.sample.edges-title-top'),
  edgeTitleBottom: t('theme.sheet.story.sample.edges-title-bottom'),
  edgeBody: t('theme.sheet.story.sample.edges-body'),
  edgeClose: t('theme.sheet.story.sample.edges-close'),
  formTrig: t('theme.sheet.story.sample.form-trigger'),
  formTitle: t('theme.sheet.story.sample.form-title'),
  formActionShare: t('theme.sheet.story.sample.form-action-share'),
  formActionArchive: t('theme.sheet.story.sample.form-action-archive'),
  formActionDuplicate: t('theme.sheet.story.sample.form-action-duplicate'),
  formActionDelete: t('theme.sheet.story.sample.form-action-delete'),
  formCancel: t('theme.sheet.story.sample.form-cancel'),
  longTrig: t('theme.sheet.story.sample.long-trigger'),
  longTitle: t('theme.sheet.story.sample.long-title'),
  longBodyP1: t('theme.sheet.story.sample.long-body-p1'),
  longBodyP2: t('theme.sheet.story.sample.long-body-p2'),
  longBodyP3: t('theme.sheet.story.sample.long-body-p3'),
  longBodyP4: t('theme.sheet.story.sample.long-body-p4'),
  longBodyP5: t('theme.sheet.story.sample.long-body-p5'),
  longClose: t('theme.sheet.story.sample.long-close'),
  eventsTrig: t('theme.sheet.story.sample.events-trigger'),
  eventsTitle: t('theme.sheet.story.sample.events-title'),
  eventsBody: t('theme.sheet.story.sample.events-body'),
  eventsClose: t('theme.sheet.story.sample.events-close'),
  eventsLogLabel: t('theme.sheet.story.sample.events-log-label'),
  eventsLogEmpty: t('theme.sheet.story.sample.events-log-empty'),
  ariaClose: t('theme.sheet.aria.close'),
};

const bodyHtml = `
  <section class="sheet-story" data-testid="sheet-root">
    <header class="sheet-story__header">
      <h1>${t('theme.sheet.story.title')}</h1>
      <p>${t('theme.sheet.story.subtitle')}</p>
    </header>

    <section class="sheet-story__section" aria-labelledby="sh-section-default">
      <h2 id="sh-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.sheet.story.section.default')}</h2>
      <p class="sheet-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.sheet.story.explainer.default')}</p>
      <div class="sheet-story__row">
        ${renderSheet({
          edge: 'end',
          trigger: triggerButton(S.defTrig, { variant: 'primary', iconLeading: 'menu' }),
          title: S.defTitle,
          body: `<p>${S.defBody}</p>`,
          footer: `
            <button type="button" class="theme-button" data-variant="secondary" data-action="click->sheet#close"><span class="theme-button__label">${S.defCancel}</span></button>
            <button type="button" class="theme-button" data-variant="primary" data-action="click->sheet#close"><span class="theme-button__label">${S.defConfirm}</span></button>
          `,
        })}
      </div>
    </section>

    <section class="sheet-story__section" aria-labelledby="sh-section-edges">
      <h2 id="sh-section-edges" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.sheet.story.section.edges')}</h2>
      <p class="sheet-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.sheet.story.explainer.edges')}</p>
      <div class="sheet-story__row">
        ${renderSheet({
          edge: 'start',
          trigger: triggerButton(S.edgeTrigStart, { variant: 'secondary' }),
          title: S.edgeTitleStart,
          body: `<p>${S.edgeBody}</p>`,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->sheet#close"><span class="theme-button__label">${S.edgeClose}</span></button>`,
        })}
        ${renderSheet({
          edge: 'end',
          trigger: triggerButton(S.edgeTrigEnd, { variant: 'secondary' }),
          title: S.edgeTitleEnd,
          body: `<p>${S.edgeBody}</p>`,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->sheet#close"><span class="theme-button__label">${S.edgeClose}</span></button>`,
        })}
        ${renderSheet({
          edge: 'top',
          trigger: triggerButton(S.edgeTrigTop, { variant: 'secondary' }),
          title: S.edgeTitleTop,
          body: `<p>${S.edgeBody}</p>`,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->sheet#close"><span class="theme-button__label">${S.edgeClose}</span></button>`,
        })}
        ${renderSheet({
          edge: 'bottom',
          trigger: triggerButton(S.edgeTrigBottom, { variant: 'secondary' }),
          title: S.edgeTitleBottom,
          body: `<p>${S.edgeBody}</p>`,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->sheet#close"><span class="theme-button__label">${S.edgeClose}</span></button>`,
        })}
      </div>
    </section>

    <section class="sheet-story__section" aria-labelledby="sh-section-form">
      <h2 id="sh-section-form" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.sheet.story.section.with-form')}</h2>
      <p class="sheet-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.sheet.story.explainer.with-form')}</p>
      <div class="sheet-story__row">
        ${renderSheet({
          edge: 'bottom',
          trigger: triggerButton(S.formTrig, { iconLeading: 'menu' }),
          title: S.formTitle,
          body: `
            <div class="theme-item" data-as="button"><div class="theme-item__leading">${icon('edit-3')}</div><div class="theme-item__text"><span class="theme-item__label">${S.formActionShare}</span></div></div>
            <div class="theme-item" data-as="button"><div class="theme-item__leading">${icon('edit-3')}</div><div class="theme-item__text"><span class="theme-item__label">${S.formActionArchive}</span></div></div>
            <div class="theme-item" data-as="button"><div class="theme-item__leading">${icon('edit-3')}</div><div class="theme-item__text"><span class="theme-item__label">${S.formActionDuplicate}</span></div></div>
            <div class="theme-item" data-as="button"><div class="theme-item__leading">${icon('trash-2')}</div><div class="theme-item__text"><span class="theme-item__label">${S.formActionDelete}</span></div></div>
          `,
          footer: `<button type="button" class="theme-button" data-variant="secondary" data-action="click->sheet#close"><span class="theme-button__label">${S.formCancel}</span></button>`,
        })}
      </div>
    </section>

    <section class="sheet-story__section" aria-labelledby="sh-section-long">
      <h2 id="sh-section-long" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.sheet.story.section.long-content')}</h2>
      <p class="sheet-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.sheet.story.explainer.long-content')}</p>
      <div class="sheet-story__row">
        ${renderSheet({
          edge: 'end',
          trigger: triggerButton(S.longTrig, { iconLeading: 'info' }),
          title: S.longTitle,
          body: `
            <p>${S.longBodyP1}</p>
            <p>${S.longBodyP2}</p>
            <p>${S.longBodyP3}</p>
            <p>${S.longBodyP4}</p>
            <p>${S.longBodyP5}</p>
          `,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->sheet#close"><span class="theme-button__label">${S.longClose}</span></button>`,
        })}
      </div>
    </section>

    <section class="sheet-story__section" aria-labelledby="sh-section-events">
      <h2 id="sh-section-events" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.sheet.story.section.events')}</h2>
      <p class="sheet-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.sheet.story.explainer.events')}</p>
      <div class="sheet-story__events">
        <div class="sheet-story__events-trigger-row">
          ${renderSheet({
            edge: 'end',
            trigger: triggerButton(S.eventsTrig, { iconLeading: 'bell' }),
            title: S.eventsTitle,
            body: `<p>${S.eventsBody}</p>`,
            footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->sheet#close"><span class="theme-button__label">${S.eventsClose}</span></button>`,
          })}
        </div>
        <div class="sheet-story__events-log">
          <span class="theme-typography" data-variant="caption" data-color="tertiary">${S.eventsLogLabel}</span>
          <pre class="sheet-story__events-log-output" data-sheet-events-log data-empty="1">${S.eventsLogEmpty}</pre>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Sheet" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="sheet-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="sheet-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.sheet-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.sheet-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.sheet-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.sheet-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.sheet-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-3); padding-block: var(--spacing-4); align-items: flex-start; }
.sheet-story__events { display: grid; gap: var(--spacing-3); }
.sheet-story__events-trigger-row { padding-block: var(--spacing-2); }
.sheet-story__events-log { display: grid; gap: var(--spacing-1); }
.sheet-story__events-log-output { font: var(--typography-code); background: var(--color-bg-sunken); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); padding: var(--spacing-2); min-block-size: 80px; max-block-size: 200px; overflow: auto; white-space: pre; color: var(--color-text-secondary); }
.sheet-story__events-log-output[data-empty="1"] { color: var(--color-text-tertiary); font-style: italic; }
.sheet-story__explainer { max-inline-size: 70ch; }
.sheet-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
