<!--
  Tooltip story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · placements (top/bottom/start/end) · with-icon-button
                · with-text-link · long-content · esc-dismiss demo.

  Stimulus controller `tooltip` (~15 lines) handles Esc dismiss + reset
  on focusout. The 400 ms show delay (anti-flash on accidental hover)
  is CSS transition-delay. The 4 placements are pure CSS-only — caller
  ensures viewport space (no JS edge-detection at Ring 1; that's Ring 2
  Popover's job).

  Visual baselines: hover is interactive, so the at-rest snapshot
  captures the hidden state. To bake the visible state, the story uses
  `:focus-within` on a programmatically-focused trigger when needed.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import infoSvg     from '../../../assets/icons/info.svg?raw';
import searchSvg   from '../../../assets/icons/search.svg?raw';
import settingsSvg from '../../../assets/icons/settings.svg?raw';
import trashSvg    from '../../../assets/icons/trash-2.svg?raw';
import copySvg     from '../../../assets/icons/copy.svg?raw';

const ICONS = { info: infoSvg, search: searchSvg, settings: settingsSvg, 'trash-2': trashSvg, copy: copySvg };

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

let _ttCounter = 0;
function nextId() { return `tt-${++_ttCounter}`; }

function icon(name, size = 'md') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderTooltip({ label, placement = 'top', triggerHtml }) {
  const id = nextId();
  return `
    <span class="cremona-tooltip-wrap"
      data-controller="tooltip"
      data-action="keydown.esc->tooltip#dismiss focusout->tooltip#reset"
      data-placement="${placement}">
      ${triggerHtml(id)}
      <span class="cremona-tooltip" id="${id}" role="tooltip" data-placement="${placement}">${label}</span>
    </span>
  `;
}

function row(html, label) {
  return `
    <div class="tooltip-story__row">
      ${label ? `<code class="tooltip-story__rowlabel">${label}</code>` : ''}
      <div class="tooltip-story__rowcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  copyAction: t('theme.tooltip.story.sample.copy-action'),
  deleteAction: t('theme.tooltip.story.sample.delete-action'),
  settingsAction: t('theme.tooltip.story.sample.settings-action'),
  searchAction: t('theme.tooltip.story.sample.search-action'),
  infoHint: t('theme.tooltip.story.sample.info-hint'),
  topLabel: t('theme.tooltip.story.sample.top-label'),
  bottomLabel: t('theme.tooltip.story.sample.bottom-label'),
  startLabel: t('theme.tooltip.story.sample.start-label'),
  endLabel: t('theme.tooltip.story.sample.end-label'),
  longContent: t('theme.tooltip.story.sample.long-content'),
  linkHint: t('theme.tooltip.story.sample.link-hint'),
  escHint: t('theme.tooltip.story.sample.esc-hint'),
  ariaCopy: t('theme.button-group.aria.copy'),
  ariaDelete: t('theme.button-group.aria.delete'),
  ariaSettings: t('theme.tooltip.story.aria.settings'),
  ariaSearch: t('theme.tooltip.story.aria.search'),
};

function iconButton(name, ariaLabel, ttId) {
  return `<button type="button" class="cremona-button" data-variant="ghost" data-size="md" aria-label="${ariaLabel}" aria-describedby="${ttId}">${icon(name)}</button>`;
}

const bodyHtml = `
  <section class="tooltip-story" data-testid="tooltip-root">
    <header class="tooltip-story__header">
      <h1>${t('theme.tooltip.story.title')}</h1>
      <p>${t('theme.tooltip.story.subtitle')}</p>
    </header>

    <section class="tooltip-story__section" aria-labelledby="tt-section-default">
      <h2 id="tt-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tooltip.story.section.default')}</h2>
      <p class="tooltip-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.tooltip.story.explainer.default')}</p>
      <div class="tooltip-story__stack">
        ${row(renderTooltip({ label: SAMPLES.copyAction, triggerHtml: (id) => iconButton('copy', SAMPLES.ariaCopy, id) }), 'icon-only ghost button + tooltip top')}
      </div>
    </section>

    <section class="tooltip-story__section" aria-labelledby="tt-section-placements">
      <h2 id="tt-section-placements" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tooltip.story.section.placements')}</h2>
      <p class="tooltip-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.tooltip.story.explainer.placements')}</p>
      <div class="tooltip-story__placements-grid">
        ${renderTooltip({ label: SAMPLES.topLabel,    placement: 'top',    triggerHtml: (id) => iconButton('info', SAMPLES.infoHint, id) })}
        ${renderTooltip({ label: SAMPLES.bottomLabel, placement: 'bottom', triggerHtml: (id) => iconButton('info', SAMPLES.infoHint, id) })}
        ${renderTooltip({ label: SAMPLES.startLabel,  placement: 'start',  triggerHtml: (id) => iconButton('info', SAMPLES.infoHint, id) })}
        ${renderTooltip({ label: SAMPLES.endLabel,    placement: 'end',    triggerHtml: (id) => iconButton('info', SAMPLES.infoHint, id) })}
      </div>
    </section>

    <section class="tooltip-story__section" aria-labelledby="tt-section-icon-button">
      <h2 id="tt-section-icon-button" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tooltip.story.section.icon-button')}</h2>
      <p class="tooltip-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.tooltip.story.explainer.icon-button')}</p>
      <div class="tooltip-story__stack">
        ${row(`
          <div class="tooltip-story__toolbar">
            ${renderTooltip({ label: SAMPLES.searchAction,   triggerHtml: (id) => iconButton('search',   SAMPLES.ariaSearch,   id) })}
            ${renderTooltip({ label: SAMPLES.settingsAction, triggerHtml: (id) => iconButton('settings', SAMPLES.ariaSettings, id) })}
            ${renderTooltip({ label: SAMPLES.copyAction,     triggerHtml: (id) => iconButton('copy',     SAMPLES.ariaCopy,     id) })}
            ${renderTooltip({ label: SAMPLES.deleteAction,   triggerHtml: (id) => iconButton('trash-2',  SAMPLES.ariaDelete,   id) })}
          </div>
        `, 'toolbar avec 4 icon-buttons + tooltips')}
      </div>
    </section>

    <section class="tooltip-story__section" aria-labelledby="tt-section-text-link">
      <h2 id="tt-section-text-link" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tooltip.story.section.text-link')}</h2>
      <div class="tooltip-story__stack">
        ${row(renderTooltip({
          label: SAMPLES.linkHint,
          placement: 'bottom',
          triggerHtml: (id) => `<a href="#" class="cremona-button" data-variant="link" aria-describedby="${id}"><span class="cremona-button__label">${t('theme.button.sample.learn-more')}</span></a>`,
        }), 'link-variant Button + tooltip bottom')}
      </div>
    </section>

    <section class="tooltip-story__section" aria-labelledby="tt-section-long">
      <h2 id="tt-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tooltip.story.section.long-content')}</h2>
      <p class="tooltip-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.tooltip.story.explainer.long-content')}</p>
      <div class="tooltip-story__stack">
        ${row(renderTooltip({
          label: SAMPLES.longContent,
          triggerHtml: (id) => iconButton('info', SAMPLES.infoHint, id),
        }), 'tooltip wrap multi-ligne (max-inline-size 280 px)')}
      </div>
    </section>

    <section class="tooltip-story__section" aria-labelledby="tt-section-esc">
      <h2 id="tt-section-esc" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.tooltip.story.section.esc')}</h2>
      <p class="tooltip-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.tooltip.story.explainer.esc')}</p>
      <div class="tooltip-story__stack">
        ${row(renderTooltip({
          label: SAMPLES.escHint,
          triggerHtml: (id) => iconButton('info', SAMPLES.infoHint, id),
        }), 'focus + Esc → tooltip dismissed (re-focus pour ré-armer)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Tooltip" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="tooltip-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="tooltip-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.tooltip-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.tooltip-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.tooltip-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.tooltip-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.tooltip-story__stack { display: grid; gap: var(--spacing-4); }
.tooltip-story__placements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--spacing-12); padding-block: var(--spacing-12); padding-inline: var(--spacing-8); justify-items: center; align-items: center; min-block-size: 200px; }
.tooltip-story__toolbar { display: inline-flex; gap: var(--spacing-1); padding: var(--spacing-2); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); }
.tooltip-story__row { display: grid; grid-template-columns: minmax(200px, 240px) 1fr; gap: var(--spacing-3); align-items: center; padding-block: var(--spacing-8); padding-inline: var(--spacing-4); }
.tooltip-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.tooltip-story__rowcontent { min-inline-size: 0; }
.tooltip-story__explainer { max-inline-size: 70ch; }
.tooltip-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
