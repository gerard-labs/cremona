<!--
  AlertDialog story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Destructive confirm (danger — default tone)
    2. Warning (archive, cancel order — primary confirm)
    3. Info (mark as complete — primary confirm)
    4. Multi-consequence (counts of lost items per 12-microcopy)
    5. Events log (alias for dialog:open / dialog:close)

  AlertDialog reuses the dialog Stimulus controller — no new JS. The
  3 destructive policies (closeOnEscape=false, closeOnBackdropClick=false,
  no close-X) are baked into the Twig template via attributes.

  Visual baselines: dialogs are closed at rest (top-layer not active).
  Events demo: a single document.addEventListener captures dialog:open /
  dialog:close. The log accumulates across all alert-dialogs (shared
  with the Dialog story's events log if both are rendered — that's
  expected, AlertDialog IS a Dialog by controller identity).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import alertTriangleSvg from '../../../assets/icons/alert-triangle.svg?raw';
import alertCircleSvg from '../../../assets/icons/alert-circle.svg?raw';
import bellSvg from '../../../assets/icons/bell.svg?raw';
import infoSvg from '../../../assets/icons/info.svg?raw';
import trashSvg from '../../../assets/icons/trash-2.svg?raw';

const ICONS = {
  'alert-triangle': alertTriangleSvg,
  'alert-circle': alertCircleSvg,
  bell: bellSvg,
  info: infoSvg,
  'trash-2': trashSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  if (typeof document !== 'undefined' && !window.__themeAlertDialogLogWired) {
    window.__themeAlertDialogLogWired = true;
    document.addEventListener('dialog:open', (e) => {
      const wrap = e.target && e.target.closest && e.target.closest('.cremona-alert-dialog-wrap');
      if (!wrap) return;
      const log = document.querySelector('[data-alert-dialog-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') {
        log.textContent = '';
        log.dataset.empty = '0';
      }
      log.textContent += 'dialog:open\n';
    });
    document.addEventListener('dialog:close', (e) => {
      const wrap = e.target && e.target.closest && e.target.closest('.cremona-alert-dialog-wrap');
      if (!wrap) return;
      const log = document.querySelector('[data-alert-dialog-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') {
        log.textContent = '';
        log.dataset.empty = '0';
      }
      log.textContent += 'dialog:close\n';
    });
  }
});

let _adCounter = 0;
function nextId() { return `ad-${++_adCounter}`; }

function icon(name, size = 'md') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function triggerButton(label, opts = {}) {
  const { variant = 'destructive', size = 'md', iconLeading = null } = opts;
  const leadingHtml = iconLeading ? `<span class="cremona-button__icon cremona-button__icon--leading">${icon(iconLeading, 'sm')}</span>` : '';
  return `<button type="button" class="cremona-button" data-variant="${variant}" data-size="${size}"
    data-action="click->dialog#open">
    ${leadingHtml}<span class="cremona-button__label">${label}</span>
  </button>`;
}

function renderAlertDialog({
  tone = 'danger',
  size = 'sm',
  trigger,
  title,
  body,
  cancelLabel,
  confirmLabel,
  confirmVariant = 'destructive',
}) {
  const id = nextId();
  const titleId = `${id}-title`;
  const iconName = tone === 'warning' ? 'alert-circle' : tone === 'info' ? 'info' : 'alert-triangle';
  return `
    <div class="cremona-dialog-wrap cremona-alert-dialog-wrap"
      data-controller="dialog"
      data-dialog-open-value="false"
      data-dialog-close-on-escape-value="false"
      data-dialog-close-on-backdrop-click-value="false">
      ${trigger}
      <dialog id="${id}" class="cremona-dialog cremona-alert-dialog"
        data-dialog-target="dialog"
        data-size="${size}"
        data-tone="${tone}"
        aria-labelledby="${titleId}">
        <header class="cremona-dialog__header cremona-alert-dialog__header">
          <span class="cremona-alert-dialog__icon-wrap" aria-hidden="true">${icon(iconName, 'md')}</span>
          <h2 id="${titleId}" class="cremona-dialog__title cremona-alert-dialog__title">${title}</h2>
        </header>
        <div class="cremona-dialog__body cremona-alert-dialog__body">
          <p>${body}</p>
        </div>
        <footer class="cremona-dialog__footer cremona-alert-dialog__footer">
          <button type="button" class="cremona-button" data-variant="secondary" data-action="click->dialog#close"><span class="cremona-button__label">${cancelLabel}</span></button>
          <button type="button" class="cremona-button" data-variant="${confirmVariant}" data-action="click->dialog#close"><span class="cremona-button__label">${confirmLabel}</span></button>
        </footer>
      </dialog>
    </div>
  `;
}

const S = {
  dangerTrig: t('theme.alert-dialog.story.sample.danger-trigger'),
  dangerTitle: t('theme.alert-dialog.story.sample.danger-title'),
  dangerBody: t('theme.alert-dialog.story.sample.danger-body'),
  dangerCancel: t('theme.alert-dialog.story.sample.danger-cancel'),
  dangerConfirm: t('theme.alert-dialog.story.sample.danger-confirm'),
  warningTrig: t('theme.alert-dialog.story.sample.warning-trigger'),
  warningTitle: t('theme.alert-dialog.story.sample.warning-title'),
  warningBody: t('theme.alert-dialog.story.sample.warning-body'),
  warningCancel: t('theme.alert-dialog.story.sample.warning-cancel'),
  warningConfirm: t('theme.alert-dialog.story.sample.warning-confirm'),
  infoTrig: t('theme.alert-dialog.story.sample.info-trigger'),
  infoTitle: t('theme.alert-dialog.story.sample.info-title'),
  infoBody: t('theme.alert-dialog.story.sample.info-body'),
  infoCancel: t('theme.alert-dialog.story.sample.info-cancel'),
  infoConfirm: t('theme.alert-dialog.story.sample.info-confirm'),
  multiTrig: t('theme.alert-dialog.story.sample.multi-trigger'),
  multiTitle: t('theme.alert-dialog.story.sample.multi-title'),
  multiBody: t('theme.alert-dialog.story.sample.multi-body'),
  multiCancel: t('theme.alert-dialog.story.sample.multi-cancel'),
  multiConfirm: t('theme.alert-dialog.story.sample.multi-confirm'),
  eventsTrig: t('theme.alert-dialog.story.sample.events-trigger'),
  eventsTitle: t('theme.alert-dialog.story.sample.events-title'),
  eventsBody: t('theme.alert-dialog.story.sample.events-body'),
  eventsCancel: t('theme.alert-dialog.story.sample.events-cancel'),
  eventsConfirm: t('theme.alert-dialog.story.sample.events-confirm'),
  eventsLogLabel: t('theme.alert-dialog.story.sample.events-log-label'),
  eventsLogEmpty: t('theme.alert-dialog.story.sample.events-log-empty'),
};

const bodyHtml = `
  <section class="alert-dialog-story" data-testid="alert-dialog-root">
    <header class="alert-dialog-story__header">
      <h1>${t('theme.alert-dialog.story.title')}</h1>
      <p>${t('theme.alert-dialog.story.subtitle')}</p>
    </header>

    <section class="alert-dialog-story__section" aria-labelledby="ad-section-danger">
      <h2 id="ad-section-danger" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.alert-dialog.story.section.danger')}</h2>
      <p class="alert-dialog-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.alert-dialog.story.explainer.danger')}</p>
      <div class="alert-dialog-story__row">
        ${renderAlertDialog({
          tone: 'danger',
          trigger: triggerButton(S.dangerTrig, { variant: 'destructive', iconLeading: 'trash-2' }),
          title: S.dangerTitle,
          body: S.dangerBody,
          cancelLabel: S.dangerCancel,
          confirmLabel: S.dangerConfirm,
          confirmVariant: 'destructive',
        })}
      </div>
    </section>

    <section class="alert-dialog-story__section" aria-labelledby="ad-section-warning">
      <h2 id="ad-section-warning" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.alert-dialog.story.section.warning')}</h2>
      <p class="alert-dialog-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.alert-dialog.story.explainer.warning')}</p>
      <div class="alert-dialog-story__row">
        ${renderAlertDialog({
          tone: 'warning',
          trigger: triggerButton(S.warningTrig, { variant: 'secondary' }),
          title: S.warningTitle,
          body: S.warningBody,
          cancelLabel: S.warningCancel,
          confirmLabel: S.warningConfirm,
          confirmVariant: 'primary',
        })}
      </div>
    </section>

    <section class="alert-dialog-story__section" aria-labelledby="ad-section-info">
      <h2 id="ad-section-info" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.alert-dialog.story.section.info')}</h2>
      <p class="alert-dialog-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.alert-dialog.story.explainer.info')}</p>
      <div class="alert-dialog-story__row">
        ${renderAlertDialog({
          tone: 'info',
          trigger: triggerButton(S.infoTrig, { variant: 'secondary' }),
          title: S.infoTitle,
          body: S.infoBody,
          cancelLabel: S.infoCancel,
          confirmLabel: S.infoConfirm,
          confirmVariant: 'primary',
        })}
      </div>
    </section>

    <section class="alert-dialog-story__section" aria-labelledby="ad-section-multi">
      <h2 id="ad-section-multi" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.alert-dialog.story.section.multi-consequence')}</h2>
      <p class="alert-dialog-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.alert-dialog.story.explainer.multi-consequence')}</p>
      <div class="alert-dialog-story__row">
        ${renderAlertDialog({
          tone: 'danger',
          size: 'md',
          trigger: triggerButton(S.multiTrig, { variant: 'destructive', iconLeading: 'trash-2' }),
          title: S.multiTitle,
          body: S.multiBody,
          cancelLabel: S.multiCancel,
          confirmLabel: S.multiConfirm,
          confirmVariant: 'destructive',
        })}
      </div>
    </section>

    <section class="alert-dialog-story__section" aria-labelledby="ad-section-events">
      <h2 id="ad-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.alert-dialog.story.section.events')}</h2>
      <p class="alert-dialog-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.alert-dialog.story.explainer.events')}</p>
      <div class="alert-dialog-story__events">
        <div class="alert-dialog-story__events-trigger-row">
          ${renderAlertDialog({
            tone: 'info',
            trigger: triggerButton(S.eventsTrig, { variant: 'secondary', iconLeading: 'bell' }),
            title: S.eventsTitle,
            body: S.eventsBody,
            cancelLabel: S.eventsCancel,
            confirmLabel: S.eventsConfirm,
            confirmVariant: 'primary',
          })}
        </div>
        <div class="alert-dialog-story__events-log">
          <span class="cremona-typography" data-variant="caption" data-color="tertiary">${S.eventsLogLabel}</span>
          <pre class="alert-dialog-story__events-log-output" data-alert-dialog-events-log data-empty="1">${S.eventsLogEmpty}</pre>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Alert Dialog" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="alert-dialog-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="alert-dialog-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.alert-dialog-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.alert-dialog-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.alert-dialog-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.alert-dialog-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.alert-dialog-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-3); padding-block: var(--spacing-4); align-items: flex-start; }
.alert-dialog-story__events { display: grid; gap: var(--spacing-3); }
.alert-dialog-story__events-trigger-row { padding-block: var(--spacing-2); }
.alert-dialog-story__events-log { display: grid; gap: var(--spacing-1); }
.alert-dialog-story__events-log-output { font: var(--typography-code); background: var(--color-bg-sunken); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); padding: var(--spacing-2); min-block-size: 80px; max-block-size: 200px; overflow: auto; white-space: pre; color: var(--color-text-secondary); }
.alert-dialog-story__events-log-output[data-empty="1"] { color: var(--color-text-tertiary); font-style: italic; }
.alert-dialog-story__explainer { max-inline-size: 70ch; }
.alert-dialog-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
