<!--
  Accordion story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5): single-mode-default · multi-mode · with-disabled-item
                · many-items-nav · composition-with-card.

  Doctrine:
    - Compose N Collapsible children via the `items` block.
    - mode="single" (default) enforces mutex — opening one closes others.
    - mode="multi" lets each Collapsible toggle independently.
    - Controller `accordion` ~80 lignes effective:
        • setRovingTabindex on connect + after each toggle
        • onChildToggle listens for collapsible:toggle bubble
        • keydown handles Arrow Up/Down + Home/End + roving focus
    - Enter / Space activate the focused trigger via native button click —
      Accordion does NOT intercept (the inner Collapsible's own click action
      handles it).
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

function chevronIcon() {
  return `<span class="theme-icon theme-icon-bidi theme-collapsible__chevron" data-icon="chevron-down" data-size="sm" aria-hidden="true" role="presentation">${chevronDownSvg}</span>`;
}

let _accordionItemCounter = 0;
function nextItemId() { return `acc-item-${++_accordionItemCounter}`; }

function renderCollapsibleItem({ triggerLabel, contentHtml, open = false, disabled = false }) {
  const id = nextItemId();
  const triggerId = `${id}-trigger`;
  const contentId = `${id}-content`;
  return `
    <div class="theme-collapsible" data-controller="collapsible" data-action="click->collapsible#toggle">
      <button type="button" id="${triggerId}" class="theme-collapsible__trigger"
              aria-expanded="${open ? 'true' : 'false'}"
              aria-controls="${contentId}"
              ${disabled ? 'disabled' : ''}>
        <span class="theme-collapsible__label">${triggerLabel}</span>
        ${chevronIcon()}
      </button>
      <div id="${contentId}" class="theme-collapsible__content"
           role="region" data-state="${open ? 'open' : 'closed'}">
        <div class="theme-collapsible__content-inner">${contentHtml}</div>
      </div>
    </div>
  `;
}

function renderAccordion({ items, mode = 'single' }) {
  const inner = items.map((item) => renderCollapsibleItem(item)).join('');
  return `
    <div class="theme-accordion"
         data-controller="accordion"
         data-action="collapsible:toggle->accordion#onChildToggle keydown->accordion#keydown"
         data-accordion-mode-value="${mode}"
         data-mode="${mode}">
      ${inner}
    </div>
  `;
}

function block(html, label) {
  return `
    <div class="accordion-story__block">
      ${label ? `<code class="accordion-story__blocklabel">${label}</code>` : ''}
      <div class="accordion-story__blockcontent">${html}</div>
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
  detailsTitle: t('theme.accordion.story.sample.details-title'),
  detailsBody: t('theme.accordion.story.sample.details-body'),
  pref1Title: t('theme.accordion.story.sample.pref-1-title'),
  pref1Body: t('theme.accordion.story.sample.pref-1-body'),
  pref2Title: t('theme.accordion.story.sample.pref-2-title'),
  pref2Body: t('theme.accordion.story.sample.pref-2-body'),
  pref3Title: t('theme.accordion.story.sample.pref-3-title'),
  pref3Body: t('theme.accordion.story.sample.pref-3-body'),
  legalTitle1: t('theme.accordion.story.sample.legal-1-title'),
  legalBody1: t('theme.accordion.story.sample.legal-1-body'),
  legalTitle2: t('theme.accordion.story.sample.legal-2-title'),
  legalBody2: t('theme.accordion.story.sample.legal-2-body'),
  legalTitle3: t('theme.accordion.story.sample.legal-3-title'),
  legalBody3: t('theme.accordion.story.sample.legal-3-body'),
  legalTitle4: t('theme.accordion.story.sample.legal-4-title'),
  legalBody4: t('theme.accordion.story.sample.legal-4-body'),
  legalTitle5: t('theme.accordion.story.sample.legal-5-title'),
  legalBody5: t('theme.accordion.story.sample.legal-5-body'),
  cardTitle: t('theme.accordion.story.sample.card-title'),
  cardSummary: t('theme.accordion.story.sample.card-summary'),
};

const bodyHtml = `
  <section class="accordion-story" data-testid="accordion-root">
    <header class="accordion-story__header">
      <h1>${t('theme.accordion.story.title')}</h1>
      <p>${t('theme.accordion.story.subtitle')}</p>
    </header>

    <section class="accordion-story__section" aria-labelledby="acc-section-single">
      <h2 id="acc-section-single" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.accordion.story.section.single')}</h2>
      <p class="accordion-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.accordion.story.explainer.single')}</p>
      <div class="accordion-story__stack">
        ${block(renderAccordion({
          mode: 'single',
          items: [
            { triggerLabel: SAMPLES.faq1Q, contentHtml: `<p>${SAMPLES.faq1A}</p>`, open: true },
            { triggerLabel: SAMPLES.faq2Q, contentHtml: `<p>${SAMPLES.faq2A}</p>` },
            { triggerLabel: SAMPLES.faq3Q, contentHtml: `<p>${SAMPLES.faq3A}</p>` },
          ],
        }), 'mode=single · ouvrir un autre ferme l\'actuel')}
      </div>
    </section>

    <section class="accordion-story__section" aria-labelledby="acc-section-multi">
      <h2 id="acc-section-multi" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.accordion.story.section.multi')}</h2>
      <p class="accordion-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.accordion.story.explainer.multi')}</p>
      <div class="accordion-story__stack">
        ${block(renderAccordion({
          mode: 'multi',
          items: [
            { triggerLabel: SAMPLES.pref1Title, contentHtml: `<p>${SAMPLES.pref1Body}</p>`, open: true },
            { triggerLabel: SAMPLES.pref2Title, contentHtml: `<p>${SAMPLES.pref2Body}</p>`, open: true },
            { triggerLabel: SAMPLES.pref3Title, contentHtml: `<p>${SAMPLES.pref3Body}</p>` },
          ],
        }), 'mode=multi · chaque item indépendant')}
      </div>
    </section>

    <section class="accordion-story__section" aria-labelledby="acc-section-disabled">
      <h2 id="acc-section-disabled" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.accordion.story.section.disabled')}</h2>
      <p class="accordion-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.accordion.story.explainer.disabled')}</p>
      <div class="accordion-story__stack">
        ${block(renderAccordion({
          mode: 'single',
          items: [
            { triggerLabel: SAMPLES.faq1Q, contentHtml: `<p>${SAMPLES.faq1A}</p>` },
            { triggerLabel: SAMPLES.detailsTitle, contentHtml: `<p>${SAMPLES.detailsBody}</p>`, disabled: true },
            { triggerLabel: SAMPLES.faq3Q, contentHtml: `<p>${SAMPLES.faq3A}</p>` },
          ],
        }), 'l\'item disabled est sauté par Arrow nav')}
      </div>
    </section>

    <section class="accordion-story__section" aria-labelledby="acc-section-many">
      <h2 id="acc-section-many" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.accordion.story.section.many-items')}</h2>
      <p class="accordion-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.accordion.story.explainer.many-items')}</p>
      <div class="accordion-story__stack">
        ${block(renderAccordion({
          mode: 'single',
          items: [
            { triggerLabel: SAMPLES.legalTitle1, contentHtml: `<p>${SAMPLES.legalBody1}</p>` },
            { triggerLabel: SAMPLES.legalTitle2, contentHtml: `<p>${SAMPLES.legalBody2}</p>` },
            { triggerLabel: SAMPLES.legalTitle3, contentHtml: `<p>${SAMPLES.legalBody3}</p>` },
            { triggerLabel: SAMPLES.legalTitle4, contentHtml: `<p>${SAMPLES.legalBody4}</p>` },
            { triggerLabel: SAMPLES.legalTitle5, contentHtml: `<p>${SAMPLES.legalBody5}</p>` },
          ],
        }), '5 items · Arrow Up/Down + Home/End nav')}
      </div>
    </section>

    <section class="accordion-story__section" aria-labelledby="acc-section-composition">
      <h2 id="acc-section-composition" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.accordion.story.section.composition')}</h2>
      <p class="accordion-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.accordion.story.explainer.composition')}</p>
      <div class="accordion-story__stack">
        ${block(`
          <article class="theme-card" data-variant="surface">
            <header class="theme-card__header">
              <h3 class="theme-typography" data-variant="h3">${SAMPLES.cardTitle}</h3>
              <p class="theme-typography" data-variant="caption" data-color="tertiary">${SAMPLES.cardSummary}</p>
            </header>
            <div class="theme-card__body">
              ${renderAccordion({
                mode: 'single',
                items: [
                  { triggerLabel: SAMPLES.pref1Title, contentHtml: `<p>${SAMPLES.pref1Body}</p>`, open: true },
                  { triggerLabel: SAMPLES.pref2Title, contentHtml: `<p>${SAMPLES.pref2Body}</p>` },
                  { triggerLabel: SAMPLES.pref3Title, contentHtml: `<p>${SAMPLES.pref3Body}</p>` },
                ],
              })}
            </div>
          </article>
        `, 'Accordion inside Card body — settings-detail pattern')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Accordion" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="accordion-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="accordion-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.accordion-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.accordion-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.accordion-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.accordion-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.accordion-story__stack { display: grid; gap: var(--spacing-3); max-inline-size: 720px; }
.accordion-story__block { display: grid; gap: var(--spacing-2); }
.accordion-story__blocklabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.accordion-story__blockcontent { min-inline-size: 0; }
.accordion-story__explainer { max-inline-size: 70ch; }
.accordion-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
