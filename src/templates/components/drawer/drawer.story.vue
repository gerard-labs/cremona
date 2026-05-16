<!--
  Drawer story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6):
    1. Default (edge=end — primary trigger)
    2. 4 edges (start / end / top / bottom side-by-side)
    3. With form (invitation pattern — focus trap demo)
    4. Long content (internal vertical scroll)
    5. Destructive policy (Esc + backdrop disabled)
    6. Events log (drawer:open / drawer:close + detail.edge)

  The drawer Stimulus controller extends DialogController — same modal
  mechanics, distinct events. Slide direction is CSS-time per edge with
  --cremona-drawer-flip handling RTL for inline-axis edges.
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
import userSvg from '../../../assets/icons/user.svg?raw';

const ICONS = {
  x: xSvg, bell: bellSvg, 'edit-3': editSvg, info: infoSvg, user: userSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  if (typeof document !== 'undefined' && !window.__themeDrawerLogWired) {
    window.__themeDrawerLogWired = true;
    document.addEventListener('drawer:open', (e) => {
      const log = document.querySelector('[data-drawer-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') { log.textContent = ''; log.dataset.empty = '0'; }
      const edge = e.detail && e.detail.edge ? ` (edge=${e.detail.edge})` : '';
      log.textContent += `drawer:open${edge}\n`;
    });
    document.addEventListener('drawer:close', () => {
      const log = document.querySelector('[data-drawer-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') { log.textContent = ''; log.dataset.empty = '0'; }
      log.textContent += 'drawer:close\n';
    });
  }
});

let _drCounter = 0;
function nextId() { return `dr-${++_drCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function triggerButton(label, opts = {}) {
  const { variant = 'primary', size = 'md', iconLeading = null } = opts;
  const leadingHtml = iconLeading ? `<span class="cremona-button__icon cremona-button__icon--leading">${icon(iconLeading)}</span>` : '';
  return `<button type="button" class="cremona-button" data-variant="${variant}" data-size="${size}"
    data-action="click->drawer#open">
    ${leadingHtml}<span class="cremona-button__label">${label}</span>
  </button>`;
}

function closeXButton(ariaLabel) {
  return `<button type="button" class="cremona-button cremona-drawer__close" data-variant="ghost" data-size="sm"
    aria-label="${ariaLabel}" data-action="click->drawer#close">${icon('x')}</button>`;
}

function renderDrawer({
  edge = 'end',
  trigger,
  title,
  body,
  footer = '',
  closeOnEscape = true,
  closeOnBackdropClick = true,
  showCloseButton = true,
}) {
  const id = nextId();
  const titleId = `${id}-title`;
  return `
    <div class="cremona-drawer-wrap"
      data-controller="drawer"
      data-drawer-open-value="false"
      data-drawer-edge-value="${edge}"
      data-drawer-close-on-escape-value="${closeOnEscape}"
      data-drawer-close-on-backdrop-click-value="${closeOnBackdropClick}">
      ${trigger}
      <dialog id="${id}" class="cremona-drawer"
        data-drawer-target="dialog"
        data-edge="${edge}"
        aria-labelledby="${titleId}">
        <header class="cremona-drawer__header">
          <h2 id="${titleId}" class="cremona-drawer__title">${title}</h2>
          ${showCloseButton ? closeXButton(S.ariaClose) : ''}
        </header>
        <div class="cremona-drawer__body">${body}</div>
        ${footer ? `<footer class="cremona-drawer__footer">${footer}</footer>` : ''}
      </dialog>
    </div>
  `;
}

const S = {
  defTrig: t('theme.drawer.story.sample.default-trigger'),
  defTitle: t('theme.drawer.story.sample.default-title'),
  defBody: t('theme.drawer.story.sample.default-body'),
  defCancel: t('theme.drawer.story.sample.default-cancel'),
  defConfirm: t('theme.drawer.story.sample.default-confirm'),
  edgeTrigStart: t('theme.drawer.story.sample.edges-trigger-start'),
  edgeTrigEnd: t('theme.drawer.story.sample.edges-trigger-end'),
  edgeTrigTop: t('theme.drawer.story.sample.edges-trigger-top'),
  edgeTrigBottom: t('theme.drawer.story.sample.edges-trigger-bottom'),
  edgeTitleStart: t('theme.drawer.story.sample.edges-title-start'),
  edgeTitleEnd: t('theme.drawer.story.sample.edges-title-end'),
  edgeTitleTop: t('theme.drawer.story.sample.edges-title-top'),
  edgeTitleBottom: t('theme.drawer.story.sample.edges-title-bottom'),
  edgeBodyStart: t('theme.drawer.story.sample.edges-body-start'),
  edgeBodyEnd: t('theme.drawer.story.sample.edges-body-end'),
  edgeBodyTop: t('theme.drawer.story.sample.edges-body-top'),
  edgeBodyBottom: t('theme.drawer.story.sample.edges-body-bottom'),
  edgeClose: t('theme.drawer.story.sample.edges-close'),
  formTrig: t('theme.drawer.story.sample.form-trigger'),
  formTitle: t('theme.drawer.story.sample.form-title'),
  formNameLabel: t('theme.drawer.story.sample.form-name-label'),
  formNamePlaceholder: t('theme.drawer.story.sample.form-name-placeholder'),
  formEmailLabel: t('theme.drawer.story.sample.form-email-label'),
  formEmailPlaceholder: t('theme.drawer.story.sample.form-email-placeholder'),
  formRoleLabel: t('theme.drawer.story.sample.form-role-label'),
  formRoleAdmin: t('theme.drawer.story.sample.form-role-admin'),
  formRoleMember: t('theme.drawer.story.sample.form-role-member'),
  formRoleViewer: t('theme.drawer.story.sample.form-role-viewer'),
  formCancel: t('theme.drawer.story.sample.form-cancel'),
  formSubmit: t('theme.drawer.story.sample.form-submit'),
  longTrig: t('theme.drawer.story.sample.long-trigger'),
  longTitle: t('theme.drawer.story.sample.long-title'),
  longBodyP1: t('theme.drawer.story.sample.long-body-p1'),
  longBodyP2: t('theme.drawer.story.sample.long-body-p2'),
  longBodyP3: t('theme.drawer.story.sample.long-body-p3'),
  longBodyP4: t('theme.drawer.story.sample.long-body-p4'),
  longBodyP5: t('theme.drawer.story.sample.long-body-p5'),
  longClose: t('theme.drawer.story.sample.long-close'),
  destrTrig: t('theme.drawer.story.sample.destructive-trigger'),
  destrTitle: t('theme.drawer.story.sample.destructive-title'),
  destrBody: t('theme.drawer.story.sample.destructive-body'),
  destrCancel: t('theme.drawer.story.sample.destructive-cancel'),
  destrConfirm: t('theme.drawer.story.sample.destructive-confirm'),
  eventsTrig: t('theme.drawer.story.sample.events-trigger'),
  eventsTitle: t('theme.drawer.story.sample.events-title'),
  eventsBody: t('theme.drawer.story.sample.events-body'),
  eventsClose: t('theme.drawer.story.sample.events-close'),
  eventsLogLabel: t('theme.drawer.story.sample.events-log-label'),
  eventsLogEmpty: t('theme.drawer.story.sample.events-log-empty'),
  ariaClose: t('theme.drawer.aria.close'),
};

const bodyHtml = `
  <section class="drawer-story" data-testid="drawer-root">
    <header class="drawer-story__header">
      <h1>${t('theme.drawer.story.title')}</h1>
      <p>${t('theme.drawer.story.subtitle')}</p>
    </header>

    <section class="drawer-story__section" aria-labelledby="dr-section-default">
      <h2 id="dr-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.drawer.story.section.default')}</h2>
      <p class="drawer-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.drawer.story.explainer.default')}</p>
      <div class="drawer-story__row">
        ${renderDrawer({
          edge: 'end',
          trigger: triggerButton(S.defTrig, { variant: 'primary', iconLeading: 'info' }),
          title: S.defTitle,
          body: `<p>${S.defBody}</p>`,
          footer: `
            <button type="button" class="cremona-button" data-variant="secondary" data-action="click->drawer#close"><span class="cremona-button__label">${S.defCancel}</span></button>
            <button type="button" class="cremona-button" data-variant="primary"><span class="cremona-button__label">${S.defConfirm}</span></button>
          `,
        })}
      </div>
    </section>

    <section class="drawer-story__section" aria-labelledby="dr-section-edges">
      <h2 id="dr-section-edges" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.drawer.story.section.edges')}</h2>
      <p class="drawer-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.drawer.story.explainer.edges')}</p>
      <div class="drawer-story__row">
        ${renderDrawer({
          edge: 'start',
          trigger: triggerButton(S.edgeTrigStart, { variant: 'secondary' }),
          title: S.edgeTitleStart,
          body: `<p>${S.edgeBodyStart}</p>`,
          footer: `<button type="button" class="cremona-button" data-variant="primary" data-action="click->drawer#close"><span class="cremona-button__label">${S.edgeClose}</span></button>`,
        })}
        ${renderDrawer({
          edge: 'end',
          trigger: triggerButton(S.edgeTrigEnd, { variant: 'secondary' }),
          title: S.edgeTitleEnd,
          body: `<p>${S.edgeBodyEnd}</p>`,
          footer: `<button type="button" class="cremona-button" data-variant="primary" data-action="click->drawer#close"><span class="cremona-button__label">${S.edgeClose}</span></button>`,
        })}
        ${renderDrawer({
          edge: 'top',
          trigger: triggerButton(S.edgeTrigTop, { variant: 'secondary' }),
          title: S.edgeTitleTop,
          body: `<p>${S.edgeBodyTop}</p>`,
          footer: `<button type="button" class="cremona-button" data-variant="primary" data-action="click->drawer#close"><span class="cremona-button__label">${S.edgeClose}</span></button>`,
        })}
        ${renderDrawer({
          edge: 'bottom',
          trigger: triggerButton(S.edgeTrigBottom, { variant: 'secondary' }),
          title: S.edgeTitleBottom,
          body: `<p>${S.edgeBodyBottom}</p>`,
          footer: `<button type="button" class="cremona-button" data-variant="primary" data-action="click->drawer#close"><span class="cremona-button__label">${S.edgeClose}</span></button>`,
        })}
      </div>
    </section>

    <section class="drawer-story__section" aria-labelledby="dr-section-form">
      <h2 id="dr-section-form" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.drawer.story.section.with-form')}</h2>
      <p class="drawer-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.drawer.story.explainer.with-form')}</p>
      <div class="drawer-story__row">
        ${renderDrawer({
          edge: 'end',
          trigger: triggerButton(S.formTrig, { iconLeading: 'user' }),
          title: S.formTitle,
          body: `
            <label class="cremona-typography" data-variant="label" style="display: block; margin-block-end: var(--spacing-1)">${S.formNameLabel}</label>
            <input type="text" class="cremona-input" placeholder="${S.formNamePlaceholder}" />
            <label class="cremona-typography" data-variant="label" style="display: block; margin-block-end: var(--spacing-1)">${S.formEmailLabel}</label>
            <input type="email" class="cremona-input" placeholder="${S.formEmailPlaceholder}" />
            <label class="cremona-typography" data-variant="label" style="display: block; margin-block-end: var(--spacing-1)">${S.formRoleLabel}</label>
            <select class="cremona-native-select">
              <option>${S.formRoleAdmin}</option>
              <option>${S.formRoleMember}</option>
              <option>${S.formRoleViewer}</option>
            </select>
          `,
          footer: `
            <button type="button" class="cremona-button" data-variant="secondary" data-action="click->drawer#close"><span class="cremona-button__label">${S.formCancel}</span></button>
            <button type="button" class="cremona-button" data-variant="primary"><span class="cremona-button__label">${S.formSubmit}</span></button>
          `,
        })}
      </div>
    </section>

    <section class="drawer-story__section" aria-labelledby="dr-section-long">
      <h2 id="dr-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.drawer.story.section.long-content')}</h2>
      <p class="drawer-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.drawer.story.explainer.long-content')}</p>
      <div class="drawer-story__row">
        ${renderDrawer({
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
          footer: `<button type="button" class="cremona-button" data-variant="primary" data-action="click->drawer#close"><span class="cremona-button__label">${S.longClose}</span></button>`,
        })}
      </div>
    </section>

    <section class="drawer-story__section" aria-labelledby="dr-section-destructive">
      <h2 id="dr-section-destructive" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.drawer.story.section.destructive')}</h2>
      <p class="drawer-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.drawer.story.explainer.destructive')}</p>
      <div class="drawer-story__row">
        ${renderDrawer({
          edge: 'end',
          trigger: triggerButton(S.destrTrig, { variant: 'destructive', iconLeading: 'edit-3' }),
          title: S.destrTitle,
          body: `<p>${S.destrBody}</p>`,
          closeOnEscape: false,
          closeOnBackdropClick: false,
          footer: `
            <button type="button" class="cremona-button" data-variant="secondary" data-action="click->drawer#close"><span class="cremona-button__label">${S.destrCancel}</span></button>
            <button type="button" class="cremona-button" data-variant="primary"><span class="cremona-button__label">${S.destrConfirm}</span></button>
          `,
        })}
      </div>
    </section>

    <section class="drawer-story__section" aria-labelledby="dr-section-events">
      <h2 id="dr-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.drawer.story.section.events')}</h2>
      <p class="drawer-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.drawer.story.explainer.events')}</p>
      <div class="drawer-story__events">
        <div class="drawer-story__events-trigger-row">
          ${renderDrawer({
            edge: 'end',
            trigger: triggerButton(S.eventsTrig, { iconLeading: 'bell' }),
            title: S.eventsTitle,
            body: `<p>${S.eventsBody}</p>`,
            footer: `<button type="button" class="cremona-button" data-variant="primary" data-action="click->drawer#close"><span class="cremona-button__label">${S.eventsClose}</span></button>`,
          })}
        </div>
        <div class="drawer-story__events-log">
          <span class="cremona-typography" data-variant="caption" data-color="tertiary">${S.eventsLogLabel}</span>
          <pre class="drawer-story__events-log-output" data-drawer-events-log data-empty="1">${S.eventsLogEmpty}</pre>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Drawer" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="drawer-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="drawer-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.drawer-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.drawer-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.drawer-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.drawer-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.drawer-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-3); padding-block: var(--spacing-4); align-items: flex-start; }
.drawer-story__events { display: grid; gap: var(--spacing-3); }
.drawer-story__events-trigger-row { padding-block: var(--spacing-2); }
.drawer-story__events-log { display: grid; gap: var(--spacing-1); }
.drawer-story__events-log-output { font: var(--typography-code); background: var(--color-bg-sunken); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); padding: var(--spacing-2); min-block-size: 80px; max-block-size: 200px; overflow: auto; white-space: pre; color: var(--color-text-secondary); }
.drawer-story__events-log-output[data-empty="1"] { color: var(--color-text-tertiary); font-style: italic; }
.drawer-story__explainer { max-inline-size: 70ch; }
.drawer-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
