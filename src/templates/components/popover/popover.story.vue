<!--
  Popover story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default click+bottom · 4 logical placements · with-form
                · collision detection demo · long content · events log.

  Stimulus controller `popover` (~180 lines) drives open/close + Floating UI
  computePosition + autoUpdate + collision detection (flip + shift) +
  click-outside dismiss (capture-phase) + Esc dismiss (window-scoped).
  See [docs/specs/ring2/Popover.md] for the full spec.

  Visual baselines: the popover content is hidden at rest (`hidden` + opacity
  0). To bake the visible state per placement, future targeted screenshots
  with programmatic open will land in a follow-up.

  Events demo: an event listener on document captures popover:open /
  popover:close, appending to an `<output>` element below the trigger. Wired
  after onMounted so the v-html-rendered DOM is in place.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import bellSvg from '../../../assets/icons/bell.svg?raw';
import chevronDownSvg from '../../../assets/icons/chevron-down.svg?raw';
import copySvg from '../../../assets/icons/copy.svg?raw';
import infoSvg from '../../../assets/icons/info.svg?raw';

const ICONS = { bell: bellSvg, 'chevron-down': chevronDownSvg, copy: copySvg, info: infoSvg };

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  // Wire the events demo log AFTER the v-html DOM is in place. Idempotent
  // (a re-mount due to story viewport switch creates fresh DOM; the listener
  // is on document so we attach once globally; the textContent reset on
  // empty resets the log between mounts).
  if (typeof document !== 'undefined' && !window.__themePopoverLogWired) {
    window.__themePopoverLogWired = true;
    document.addEventListener('popover:open', (e) => {
      const log = document.querySelector('[data-popover-events-log]');
      if (!log) return;
      const placement = (e.detail && e.detail.placement) || '?';
      if (log.dataset.empty === '1') {
        log.textContent = '';
        log.dataset.empty = '0';
      }
      log.textContent += `popover:open  placement=${placement}\n`;
    });
    document.addEventListener('popover:close', () => {
      const log = document.querySelector('[data-popover-events-log]');
      if (!log) return;
      if (log.dataset.empty === '1') {
        log.textContent = '';
        log.dataset.empty = '0';
      }
      log.textContent += 'popover:close\n';
    });
  }
});

let _ppCounter = 0;
function nextId() { return `pp-${++_ppCounter}`; }

function icon(name, size = 'md') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function triggerButton(label, ariaLabel, popoverId, opts = {}) {
  const { iconLeading, trailing = 'chevron-down', variant = 'secondary', size = 'md' } = opts;
  const ariaAttr = ariaLabel ? `aria-label="${ariaLabel}"` : '';
  const leadingHtml = iconLeading ? `<span class="cremona-button__icon cremona-button__icon--leading">${icon(iconLeading)}</span>` : '';
  const trailingHtml = trailing ? `<span class="cremona-button__icon cremona-button__icon--trailing">${icon(trailing, 'sm')}</span>` : '';
  return `
    <button type="button" class="cremona-button" data-variant="${variant}" data-size="${size}"
      data-popover-target="trigger"
      aria-haspopup="dialog" aria-expanded="false" aria-controls="${popoverId}" ${ariaAttr}>
      ${leadingHtml}<span class="cremona-button__label">${label}</span>${trailingHtml}
    </button>
  `;
}

function renderPopover({ placement = 'bottom', triggerHtml, contentHtml, offset = 8 }) {
  const id = nextId();
  return `
    <div class="cremona-popover"
      data-controller="popover"
      data-action="click->popover#toggle keydown.esc@window->popover#close"
      data-popover-placement-value="${placement}"
      data-popover-offset-value="${offset}"
      data-popover-open-value="false">
      ${triggerHtml(id)}
      <div id="${id}" class="cremona-popover__content"
        data-popover-target="content"
        data-state="closed"
        data-placement="${placement}"
        hidden>
        ${contentHtml}
      </div>
    </div>
  `;
}

const S = {
  tagsTrigger: t('theme.popover.story.sample.tags-trigger'),
  tagsTitle: t('theme.popover.story.sample.tags-title'),
  tagsBody: t('theme.popover.story.sample.tags-body'),
  shareTrigger: t('theme.popover.story.sample.share-trigger'),
  shareTitle: t('theme.popover.story.sample.share-title'),
  shareLinkLabel: t('theme.popover.story.sample.share-link-label'),
  shareLinkValue: t('theme.popover.story.sample.share-link-value'),
  shareCopy: t('theme.popover.story.sample.share-copy'),
  placementTopT: t('theme.popover.story.sample.placement-trigger-top'),
  placementBotT: t('theme.popover.story.sample.placement-trigger-bottom'),
  placementStaT: t('theme.popover.story.sample.placement-trigger-start'),
  placementEndT: t('theme.popover.story.sample.placement-trigger-end'),
  placementTopC: t('theme.popover.story.sample.placement-content-top'),
  placementBotC: t('theme.popover.story.sample.placement-content-bottom'),
  placementStaC: t('theme.popover.story.sample.placement-content-start'),
  placementEndC: t('theme.popover.story.sample.placement-content-end'),
  collisionTrigger: t('theme.popover.story.sample.collision-trigger'),
  collisionBody: t('theme.popover.story.sample.collision-body'),
  longTrigger: t('theme.popover.story.sample.long-trigger'),
  longBody: t('theme.popover.story.sample.long-body'),
  eventsTrigger: t('theme.popover.story.sample.events-trigger'),
  eventsTitle: t('theme.popover.story.sample.events-title'),
  eventsBody: t('theme.popover.story.sample.events-body'),
  eventsLogLabel: t('theme.popover.story.sample.events-log-label'),
  eventsLogEmpty: t('theme.popover.story.sample.events-log-empty'),
  ariaTags: t('theme.popover.story.aria.tags-trigger'),
  ariaShare: t('theme.popover.story.aria.share-trigger'),
};

const bodyHtml = `
  <section class="popover-story" data-testid="popover-root">
    <header class="popover-story__header">
      <h1>${t('theme.popover.story.title')}</h1>
      <p>${t('theme.popover.story.subtitle')}</p>
    </header>

    <section class="popover-story__section" aria-labelledby="pp-section-default">
      <h2 id="pp-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.popover.story.section.default')}</h2>
      <p class="popover-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.popover.story.explainer.default')}</p>
      <div class="popover-story__row">
        ${renderPopover({
          placement: 'bottom',
          triggerHtml: (id) => triggerButton(S.tagsTrigger, S.ariaTags, id),
          contentHtml: `
            <div class="cremona-popover__header">
              <h3 class="cremona-popover__title">${S.tagsTitle}</h3>
            </div>
            <p>${S.tagsBody}</p>
          `,
        })}
      </div>
    </section>

    <section class="popover-story__section" aria-labelledby="pp-section-placements">
      <h2 id="pp-section-placements" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.popover.story.section.placements')}</h2>
      <p class="popover-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.popover.story.explainer.placements')}</p>
      <div class="popover-story__placements-grid">
        ${renderPopover({
          placement: 'top',
          triggerHtml: (id) => triggerButton(S.placementTopT, null, id),
          contentHtml: `<p>${S.placementTopC}</p>`,
        })}
        ${renderPopover({
          placement: 'bottom',
          triggerHtml: (id) => triggerButton(S.placementBotT, null, id),
          contentHtml: `<p>${S.placementBotC}</p>`,
        })}
        ${renderPopover({
          placement: 'start',
          triggerHtml: (id) => triggerButton(S.placementStaT, null, id),
          contentHtml: `<p>${S.placementStaC}</p>`,
        })}
        ${renderPopover({
          placement: 'end',
          triggerHtml: (id) => triggerButton(S.placementEndT, null, id),
          contentHtml: `<p>${S.placementEndC}</p>`,
        })}
      </div>
    </section>

    <section class="popover-story__section" aria-labelledby="pp-section-with-form">
      <h2 id="pp-section-with-form" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.popover.story.section.with-form')}</h2>
      <p class="popover-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.popover.story.explainer.with-form')}</p>
      <div class="popover-story__row">
        ${renderPopover({
          placement: 'bottom',
          triggerHtml: (id) => triggerButton(S.shareTrigger, S.ariaShare, id, { iconLeading: 'copy' }),
          contentHtml: `
            <div class="cremona-popover__header">
              <h3 class="cremona-popover__title">${S.shareTitle}</h3>
            </div>
            <div class="popover-story__share-form">
              <label class="cremona-typography" data-variant="caption" data-color="tertiary">${S.shareLinkLabel}</label>
              <input type="text" class="cremona-input" value="${S.shareLinkValue}" readonly />
              <button type="button" class="cremona-button" data-variant="primary" data-size="sm">
                <span class="cremona-button__icon cremona-button__icon--leading">${icon('copy', 'sm')}</span>
                <span class="cremona-button__label">${S.shareCopy}</span>
              </button>
            </div>
          `,
        })}
      </div>
    </section>

    <section class="popover-story__section" aria-labelledby="pp-section-collision">
      <h2 id="pp-section-collision" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.popover.story.section.collision')}</h2>
      <p class="popover-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.popover.story.explainer.collision')}</p>
      <div class="popover-story__collision-box">
        ${renderPopover({
          placement: 'top',
          triggerHtml: (id) => triggerButton(S.collisionTrigger, null, id, { iconLeading: 'info' }),
          contentHtml: `<p>${S.collisionBody}</p>`,
        })}
      </div>
    </section>

    <section class="popover-story__section" aria-labelledby="pp-section-long">
      <h2 id="pp-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.popover.story.section.long-content')}</h2>
      <p class="popover-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.popover.story.explainer.long-content')}</p>
      <div class="popover-story__row">
        ${renderPopover({
          placement: 'bottom',
          triggerHtml: (id) => triggerButton(S.longTrigger, null, id, { iconLeading: 'info' }),
          contentHtml: `<p>${S.longBody}</p>`,
        })}
      </div>
    </section>

    <section class="popover-story__section" aria-labelledby="pp-section-events">
      <h2 id="pp-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.popover.story.section.events')}</h2>
      <p class="popover-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.popover.story.explainer.events')}</p>
      <div class="popover-story__events">
        <div class="popover-story__events-trigger-row">
          ${renderPopover({
            placement: 'bottom',
            triggerHtml: (id) => triggerButton(S.eventsTrigger, null, id, { iconLeading: 'bell' }),
            contentHtml: `
              <div class="cremona-popover__header">
                <h3 class="cremona-popover__title">${S.eventsTitle}</h3>
              </div>
              <p>${S.eventsBody}</p>
            `,
          })}
        </div>
        <div class="popover-story__events-log">
          <span class="cremona-typography" data-variant="caption" data-color="tertiary">${S.eventsLogLabel}</span>
          <pre class="popover-story__events-log-output" data-popover-events-log data-empty="1">${S.eventsLogEmpty}</pre>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Popover" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="popover-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="popover-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.popover-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.popover-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.popover-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.popover-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.popover-story__row { display: flex; gap: var(--spacing-4); padding-block: var(--spacing-6); align-items: flex-start; }
.popover-story__placements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--spacing-12); padding-block: var(--spacing-12); padding-inline: var(--spacing-8); justify-items: center; align-items: center; min-block-size: 200px; }
.popover-story__collision-box { display: flex; justify-content: center; padding-block-start: var(--spacing-1); padding-block-end: var(--spacing-12); }
.popover-story__share-form { display: grid; gap: var(--spacing-2); }
.popover-story__share-form .cremona-input { font: var(--typography-body); }
.popover-story__events { display: grid; gap: var(--spacing-3); }
.popover-story__events-trigger-row { padding-block: var(--spacing-4); }
.popover-story__events-log { display: grid; gap: var(--spacing-1); }
.popover-story__events-log-output { font: var(--typography-code); background: var(--color-bg-sunken); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); padding: var(--spacing-2); min-block-size: 80px; max-block-size: 200px; overflow: auto; white-space: pre; color: var(--color-text-secondary); }
.popover-story__events-log-output[data-empty="1"] { color: var(--color-text-tertiary); font-style: italic; }
.popover-story__explainer { max-inline-size: 70ch; }
.popover-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
