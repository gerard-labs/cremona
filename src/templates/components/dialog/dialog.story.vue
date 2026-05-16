<!--
  Dialog story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · sizes (sm/md/lg) · with-form · destructive
                (Esc + backdrop disabled) · long content (vertical scroll)
                · events log.

  Stimulus controller `dialog` (~120 lines) wraps native `<dialog>` +
  showModal() + close() + cancel/close event sync + focus return +
  backdrop click policy. CSS-only entry/exit animations via
  `@starting-style` + `transition allow-discrete` (Baseline 2024).

  Visual baselines: dialogs are closed at rest (top-layer not active).
  Future targeted screenshots with programmatic open (ctrl.open() + wait
  + screenshot) can bake the visible state per size.

  Events demo: a single document.addEventListener captures dialog:open /
  dialog:close. The log accumulates across all dialogs in the story.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import xSvg from '../../../assets/icons/x.svg?raw';
import alertTriangleSvg from '../../../assets/icons/alert-triangle.svg?raw';
import bellSvg from '../../../assets/icons/bell.svg?raw';
import editSvg from '../../../assets/icons/edit-3.svg?raw';
import infoSvg from '../../../assets/icons/info.svg?raw';
import trashSvg from '../../../assets/icons/trash-2.svg?raw';
import userSvg from '../../../assets/icons/user.svg?raw';

const ICONS = {
  x: xSvg, 'alert-triangle': alertTriangleSvg, bell: bellSvg,
  'edit-3': editSvg, info: infoSvg, 'trash-2': trashSvg, user: userSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  if (typeof document !== 'undefined' && !window.__themeDialogLogWired) {
    window.__themeDialogLogWired = true;
    document.addEventListener('dialog:open', () => {
      const log = document.querySelector('[data-dialog-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') {
        log.textContent = '';
        log.dataset.empty = '0';
      }
      log.textContent += 'dialog:open\n';
    });
    document.addEventListener('dialog:close', () => {
      const log = document.querySelector('[data-dialog-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') {
        log.textContent = '';
        log.dataset.empty = '0';
      }
      log.textContent += 'dialog:close\n';
    });
  }
});

let _dCounter = 0;
function nextId() { return `dlg-${++_dCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="theme-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function triggerButton(label, opts = {}) {
  const { variant = 'secondary', size = 'md', iconLeading = null } = opts;
  const leadingHtml = iconLeading ? `<span class="theme-button__icon theme-button__icon--leading">${icon(iconLeading)}</span>` : '';
  return `<button type="button" class="theme-button" data-variant="${variant}" data-size="${size}"
    data-action="click->dialog#open">
    ${leadingHtml}<span class="theme-button__label">${label}</span>
  </button>`;
}

function closeButton(ariaLabel) {
  return `<button type="button" class="theme-button theme-dialog__close" data-variant="ghost" data-size="sm"
    aria-label="${ariaLabel}" data-action="click->dialog#close">${icon('x')}</button>`;
}

function renderDialog({
  size = 'md',
  trigger,
  title,
  body,
  footer = '',
  closeOnEscape = true,
  closeOnBackdropClick = true,
  showCloseButton = true,
  dialogClass = '',
}) {
  const id = nextId();
  const titleId = `${id}-title`;
  return `
    <div class="theme-dialog-wrap"
      data-controller="dialog"
      data-dialog-open-value="false"
      data-dialog-close-on-escape-value="${closeOnEscape}"
      data-dialog-close-on-backdrop-click-value="${closeOnBackdropClick}">
      ${trigger}
      <dialog id="${id}" class="theme-dialog ${dialogClass}"
        data-dialog-target="dialog"
        data-size="${size}"
        aria-labelledby="${titleId}">
        <header class="theme-dialog__header">
          <h2 id="${titleId}" class="theme-dialog__title">${title}</h2>
          ${showCloseButton ? closeButton(S.ariaClose) : ''}
        </header>
        <div class="theme-dialog__body">${body}</div>
        ${footer ? `<footer class="theme-dialog__footer">${footer}</footer>` : ''}
      </dialog>
    </div>
  `;
}

const S = {
  defaultTrig: t('theme.dialog.story.sample.default-trigger'),
  defaultTitle: t('theme.dialog.story.sample.default-title'),
  defaultBody1: t('theme.dialog.story.sample.default-body-1'),
  defaultCancel: t('theme.dialog.story.sample.default-cancel'),
  defaultConfirm: t('theme.dialog.story.sample.default-confirm'),
  sizeTrigSm: t('theme.dialog.story.sample.size-trigger-sm'),
  sizeTrigMd: t('theme.dialog.story.sample.size-trigger-md'),
  sizeTrigLg: t('theme.dialog.story.sample.size-trigger-lg'),
  sizeTitleSm: t('theme.dialog.story.sample.size-title-sm'),
  sizeTitleMd: t('theme.dialog.story.sample.size-title-md'),
  sizeTitleLg: t('theme.dialog.story.sample.size-title-lg'),
  sizeBodySm: t('theme.dialog.story.sample.size-body-sm'),
  sizeBodyMd: t('theme.dialog.story.sample.size-body-md'),
  sizeBodyLg: t('theme.dialog.story.sample.size-body-lg'),
  formTrig: t('theme.dialog.story.sample.form-trigger'),
  formTitle: t('theme.dialog.story.sample.form-title'),
  formLabel: t('theme.dialog.story.sample.form-label'),
  formPlaceholder: t('theme.dialog.story.sample.form-placeholder'),
  formCancel: t('theme.dialog.story.sample.form-cancel'),
  formSave: t('theme.dialog.story.sample.form-save'),
  destrTrig: t('theme.dialog.story.sample.destructive-trigger'),
  destrTitle: t('theme.dialog.story.sample.destructive-title'),
  destrBody: t('theme.dialog.story.sample.destructive-body'),
  destrCancel: t('theme.dialog.story.sample.destructive-cancel'),
  destrConfirm: t('theme.dialog.story.sample.destructive-confirm'),
  longTrig: t('theme.dialog.story.sample.long-trigger'),
  longTitle: t('theme.dialog.story.sample.long-title'),
  longBodyP1: t('theme.dialog.story.sample.long-body-p1'),
  longBodyP2: t('theme.dialog.story.sample.long-body-p2'),
  longBodyP3: t('theme.dialog.story.sample.long-body-p3'),
  longBodyP4: t('theme.dialog.story.sample.long-body-p4'),
  longBodyP5: t('theme.dialog.story.sample.long-body-p5'),
  longClose: t('theme.dialog.story.sample.long-close'),
  eventsTrig: t('theme.dialog.story.sample.events-trigger'),
  eventsTitle: t('theme.dialog.story.sample.events-title'),
  eventsBody: t('theme.dialog.story.sample.events-body'),
  eventsClose: t('theme.dialog.story.sample.events-close'),
  eventsLogLabel: t('theme.dialog.story.sample.events-log-label'),
  eventsLogEmpty: t('theme.dialog.story.sample.events-log-empty'),
  ariaClose: t('theme.dialog.story.aria.close'),
};

const bodyHtml = `
  <section class="dialog-story" data-testid="dialog-root">
    <header class="dialog-story__header">
      <h1>${t('theme.dialog.story.title')}</h1>
      <p>${t('theme.dialog.story.subtitle')}</p>
    </header>

    <section class="dialog-story__section" aria-labelledby="dlg-section-default">
      <h2 id="dlg-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.dialog.story.section.default')}</h2>
      <p class="dialog-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.dialog.story.explainer.default')}</p>
      <div class="dialog-story__row">
        ${renderDialog({
          size: 'md',
          trigger: triggerButton(S.defaultTrig, { variant: 'primary', iconLeading: 'user' }),
          title: S.defaultTitle,
          body: `<p>${S.defaultBody1}</p>`,
          footer: `
            <button type="button" class="theme-button" data-variant="secondary" data-action="click->dialog#close"><span class="theme-button__label">${S.defaultCancel}</span></button>
            <button type="button" class="theme-button" data-variant="primary"><span class="theme-button__label">${S.defaultConfirm}</span></button>
          `,
        })}
      </div>
    </section>

    <section class="dialog-story__section" aria-labelledby="dlg-section-sizes">
      <h2 id="dlg-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.dialog.story.section.sizes')}</h2>
      <p class="dialog-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.dialog.story.explainer.sizes')}</p>
      <div class="dialog-story__row">
        ${renderDialog({
          size: 'sm',
          trigger: triggerButton(S.sizeTrigSm),
          title: S.sizeTitleSm,
          body: `<p>${S.sizeBodySm}</p>`,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->dialog#close"><span class="theme-button__label">${S.defaultCancel}</span></button>`,
        })}
        ${renderDialog({
          size: 'md',
          trigger: triggerButton(S.sizeTrigMd),
          title: S.sizeTitleMd,
          body: `<p>${S.sizeBodyMd}</p>`,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->dialog#close"><span class="theme-button__label">${S.defaultCancel}</span></button>`,
        })}
        ${renderDialog({
          size: 'lg',
          trigger: triggerButton(S.sizeTrigLg),
          title: S.sizeTitleLg,
          body: `<p>${S.sizeBodyLg}</p>`,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->dialog#close"><span class="theme-button__label">${S.defaultCancel}</span></button>`,
        })}
      </div>
    </section>

    <section class="dialog-story__section" aria-labelledby="dlg-section-with-form">
      <h2 id="dlg-section-with-form" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.dialog.story.section.with-form')}</h2>
      <p class="dialog-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.dialog.story.explainer.with-form')}</p>
      <div class="dialog-story__row">
        ${renderDialog({
          size: 'md',
          trigger: triggerButton(S.formTrig, { iconLeading: 'edit-3' }),
          title: S.formTitle,
          body: `
            <label class="theme-typography" data-variant="label" style="display: block; margin-block-end: var(--spacing-1)">${S.formLabel}</label>
            <input type="text" class="theme-input" placeholder="${S.formPlaceholder}" />
          `,
          footer: `
            <button type="button" class="theme-button" data-variant="secondary" data-action="click->dialog#close"><span class="theme-button__label">${S.formCancel}</span></button>
            <button type="button" class="theme-button" data-variant="primary"><span class="theme-button__label">${S.formSave}</span></button>
          `,
        })}
      </div>
    </section>

    <section class="dialog-story__section" aria-labelledby="dlg-section-destructive">
      <h2 id="dlg-section-destructive" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.dialog.story.section.destructive')}</h2>
      <p class="dialog-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.dialog.story.explainer.destructive')}</p>
      <div class="dialog-story__row">
        ${renderDialog({
          size: 'md',
          trigger: triggerButton(S.destrTrig, { variant: 'destructive', iconLeading: 'trash-2' }),
          title: S.destrTitle,
          body: `<p>${S.destrBody}</p>`,
          closeOnEscape: false,
          closeOnBackdropClick: false,
          footer: `
            <button type="button" class="theme-button" data-variant="secondary" data-action="click->dialog#close"><span class="theme-button__label">${S.destrCancel}</span></button>
            <button type="button" class="theme-button" data-variant="destructive" data-action="click->dialog#close"><span class="theme-button__label">${S.destrConfirm}</span></button>
          `,
        })}
      </div>
    </section>

    <section class="dialog-story__section" aria-labelledby="dlg-section-long">
      <h2 id="dlg-section-long" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.dialog.story.section.long')}</h2>
      <p class="dialog-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.dialog.story.explainer.long')}</p>
      <div class="dialog-story__row">
        ${renderDialog({
          size: 'lg',
          trigger: triggerButton(S.longTrig, { iconLeading: 'info' }),
          title: S.longTitle,
          body: `
            <p>${S.longBodyP1}</p>
            <p>${S.longBodyP2}</p>
            <p>${S.longBodyP3}</p>
            <p>${S.longBodyP4}</p>
            <p>${S.longBodyP5}</p>
          `,
          footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->dialog#close"><span class="theme-button__label">${S.longClose}</span></button>`,
        })}
      </div>
    </section>

    <section class="dialog-story__section" aria-labelledby="dlg-section-events">
      <h2 id="dlg-section-events" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.dialog.story.section.events')}</h2>
      <p class="dialog-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.dialog.story.explainer.events')}</p>
      <div class="dialog-story__events">
        <div class="dialog-story__events-trigger-row">
          ${renderDialog({
            size: 'md',
            trigger: triggerButton(S.eventsTrig, { iconLeading: 'bell' }),
            title: S.eventsTitle,
            body: `<p>${S.eventsBody}</p>`,
            footer: `<button type="button" class="theme-button" data-variant="primary" data-action="click->dialog#close"><span class="theme-button__label">${S.eventsClose}</span></button>`,
          })}
        </div>
        <div class="dialog-story__events-log">
          <span class="theme-typography" data-variant="caption" data-color="tertiary">${S.eventsLogLabel}</span>
          <pre class="dialog-story__events-log-output" data-dialog-events-log data-empty="1">${S.eventsLogEmpty}</pre>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Dialog" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="dialog-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="dialog-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.dialog-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.dialog-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.dialog-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.dialog-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.dialog-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-3); padding-block: var(--spacing-4); align-items: flex-start; }
.dialog-story__events { display: grid; gap: var(--spacing-3); }
.dialog-story__events-trigger-row { padding-block: var(--spacing-2); }
.dialog-story__events-log { display: grid; gap: var(--spacing-1); }
.dialog-story__events-log-output { font: var(--typography-code); background: var(--color-bg-sunken); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); padding: var(--spacing-2); min-block-size: 80px; max-block-size: 200px; overflow: auto; white-space: pre; color: var(--color-text-secondary); }
.dialog-story__events-log-output[data-empty="1"] { color: var(--color-text-tertiary); font-style: italic; }
.dialog-story__explainer { max-inline-size: 70ch; }
.dialog-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
