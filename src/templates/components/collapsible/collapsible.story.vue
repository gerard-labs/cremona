<!--
  Collapsible story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · open-by-default · no-chevron · multiple-independent
                · composition-with-card · long-content.

  Doctrine:
    - Custom <button aria-expanded> + sibling content (native <details>
      doesn't animate without JS interception).
    - Animation: grid-template-rows: 0fr → 1fr (CSS-only).
    - Controller `collapsible` ~25 lines effective — flips aria-expanded +
      data-state, dispatches `collapsible:toggle`. Accordion (next primitive)
      composes N Collapsible and listens for bubble.
    - Section §"multiple-independent" is the Ring 1 preview of what Accordion
      will turn into a single-mode mutex (Ring 1 still ships them independent —
      Accordion is the orchestrator).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import chevronDownSvg from '../../../assets/icons/chevron-down.svg?raw';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

let _collapsibleCounter = 0;
function nextId() { return `collapsible-${++_collapsibleCounter}`; }

function chevronIcon() {
  return `<span class="cremona-icon cremona-icon-bidi cremona-collapsible__chevron" data-icon="chevron-down" data-size="sm" aria-hidden="true" role="presentation">${chevronDownSvg}</span>`;
}

function renderCollapsible({
  triggerLabel,
  triggerHtml = null,
  contentHtml,
  open = false,
  iconChevron = true,
}) {
  const id = nextId();
  const triggerId = `${id}-trigger`;
  const contentId = `${id}-content`;
  const labelBlock = triggerHtml
    ? triggerHtml
    : `<span class="cremona-collapsible__label">${triggerLabel}</span>`;
  return `
    <div class="cremona-collapsible" data-controller="collapsible" data-action="click->collapsible#toggle">
      <button type="button" id="${triggerId}" class="cremona-collapsible__trigger"
              aria-expanded="${open ? 'true' : 'false'}"
              aria-controls="${contentId}">
        ${labelBlock}
        ${iconChevron ? chevronIcon() : ''}
      </button>
      <div id="${contentId}" class="cremona-collapsible__content"
           role="region" aria-labelledby="${triggerId}"
           data-state="${open ? 'open' : 'closed'}">
        <div class="cremona-collapsible__content-inner">${contentHtml}</div>
      </div>
    </div>
  `;
}

function block(html, label) {
  return `
    <div class="collapsible-story__block">
      ${label ? `<code class="collapsible-story__blocklabel">${label}</code>` : ''}
      <div class="collapsible-story__blockcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  faq1Q: t('theme.collapsible.story.sample.faq-1-question'),
  faq1A: t('theme.collapsible.story.sample.faq-1-answer'),
  faq2Q: t('theme.collapsible.story.sample.faq-2-question'),
  faq2A: t('theme.collapsible.story.sample.faq-2-answer'),
  faq3Q: t('theme.collapsible.story.sample.faq-3-question'),
  faq3A: t('theme.collapsible.story.sample.faq-3-answer'),
  detailsTitle: t('theme.collapsible.story.sample.details-title'),
  detailsBody: t('theme.collapsible.story.sample.details-body'),
  inCardTitle: t('theme.collapsible.story.sample.in-card-title'),
  inCardSummary: t('theme.collapsible.story.sample.in-card-summary'),
  inCardBody: t('theme.collapsible.story.sample.in-card-body'),
  longTitle: t('theme.collapsible.story.sample.long-title'),
  longP1: t('theme.collapsible.story.sample.long-p1'),
  longP2: t('theme.collapsible.story.sample.long-p2'),
  longP3: t('theme.collapsible.story.sample.long-p3'),
};

const bodyHtml = `
  <section class="collapsible-story" data-testid="collapsible-root">
    <header class="collapsible-story__header">
      <h1>${t('theme.collapsible.story.title')}</h1>
      <p>${t('theme.collapsible.story.subtitle')}</p>
    </header>

    <section class="collapsible-story__section" aria-labelledby="coll-section-default">
      <h2 id="coll-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.collapsible.story.section.default')}</h2>
      <p class="collapsible-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.collapsible.story.explainer.default')}</p>
      <div class="collapsible-story__stack">
        ${block(renderCollapsible({
          triggerLabel: SAMPLES.faq1Q,
          contentHtml: `<p>${SAMPLES.faq1A}</p>`,
        }), 'closed initial state — click to open')}
      </div>
    </section>

    <section class="collapsible-story__section" aria-labelledby="coll-section-open">
      <h2 id="coll-section-open" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.collapsible.story.section.open-by-default')}</h2>
      <p class="collapsible-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.collapsible.story.explainer.open-by-default')}</p>
      <div class="collapsible-story__stack">
        ${block(renderCollapsible({
          triggerLabel: SAMPLES.faq2Q,
          contentHtml: `<p>${SAMPLES.faq2A}</p>`,
          open: true,
        }), 'open=true initial state')}
      </div>
    </section>

    <section class="collapsible-story__section" aria-labelledby="coll-section-no-chevron">
      <h2 id="coll-section-no-chevron" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.collapsible.story.section.no-chevron')}</h2>
      <p class="collapsible-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.collapsible.story.explainer.no-chevron')}</p>
      <div class="collapsible-story__stack">
        ${block(renderCollapsible({
          triggerLabel: SAMPLES.detailsTitle,
          contentHtml: `<p>${SAMPLES.detailsBody}</p>`,
          iconChevron: false,
        }), 'iconChevron=false — minimal trigger')}
      </div>
    </section>

    <section class="collapsible-story__section" aria-labelledby="coll-section-multiple">
      <h2 id="coll-section-multiple" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.collapsible.story.section.multiple-independent')}</h2>
      <p class="collapsible-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.collapsible.story.explainer.multiple-independent')}</p>
      <div class="collapsible-story__stack collapsible-story__stack--tight">
        ${renderCollapsible({ triggerLabel: SAMPLES.faq1Q, contentHtml: `<p>${SAMPLES.faq1A}</p>` })}
        ${renderCollapsible({ triggerLabel: SAMPLES.faq2Q, contentHtml: `<p>${SAMPLES.faq2A}</p>` })}
        ${renderCollapsible({ triggerLabel: SAMPLES.faq3Q, contentHtml: `<p>${SAMPLES.faq3A}</p>` })}
      </div>
    </section>

    <section class="collapsible-story__section" aria-labelledby="coll-section-composition">
      <h2 id="coll-section-composition" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.collapsible.story.section.composition')}</h2>
      <p class="collapsible-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.collapsible.story.explainer.composition')}</p>
      <div class="collapsible-story__stack">
        ${block(`
          <article class="cremona-card" data-variant="surface">
            <header class="cremona-card__header">
              <h3 class="cremona-typography" data-variant="h3">${SAMPLES.inCardTitle}</h3>
              <p class="cremona-typography" data-variant="caption" data-color="tertiary">${SAMPLES.inCardSummary}</p>
            </header>
            <div class="cremona-card__body">
              ${renderCollapsible({
                triggerLabel: SAMPLES.detailsTitle,
                contentHtml: `<p>${SAMPLES.inCardBody}</p>`,
              })}
            </div>
          </article>
        `, 'Collapsible inside Card body — typical settings-detail pattern')}
      </div>
    </section>

    <section class="collapsible-story__section" aria-labelledby="coll-section-long">
      <h2 id="coll-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.collapsible.story.section.long-content')}</h2>
      <div class="collapsible-story__stack">
        ${block(renderCollapsible({
          triggerLabel: SAMPLES.longTitle,
          contentHtml: `<p>${SAMPLES.longP1}</p><p>${SAMPLES.longP2}</p><p>${SAMPLES.longP3}</p>`,
          open: true,
        }), 'open + 3 paragraphes (+30 % FR)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Collapsible" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="collapsible-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="collapsible-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.collapsible-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.collapsible-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.collapsible-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.collapsible-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.collapsible-story__stack { display: grid; gap: var(--spacing-3); max-inline-size: 720px; }
.collapsible-story__stack--tight { gap: var(--spacing-2); }
.collapsible-story__block { display: grid; gap: var(--spacing-2); }
.collapsible-story__blocklabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.collapsible-story__blockcontent { min-inline-size: 0; }
.collapsible-story__explainer { max-inline-size: 70ch; }
.collapsible-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
