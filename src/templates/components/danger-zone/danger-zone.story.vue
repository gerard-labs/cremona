<!--
  DangerZone story — 4 viewport variants.
  Sections : inline-default · inline-armed · modal-trigger.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderInlineDangerZone({ id, expected = 'SUPPRIMER', preFilled = '' }) {
  const armed = preFilled === expected;
  return `
    <article class="cremona-card cremona-danger-zone"
             id="${id}"
             data-variant="elevated"
             data-danger-zone-variant="inline"
             data-danger-zone-expected-value="${expected}"
             data-danger-zone-match-mode-value="exact"
             data-danger-zone-state="${armed ? 'armed' : 'idle'}">
      <header class="cremona-card__header cremona-danger-zone__header">
        <h3 class="cremona-typography cremona-danger-zone__title" data-variant="h3">${t('theme.danger-zone.story.sample.title')}</h3>
      </header>
      <div class="cremona-card__body cremona-danger-zone__body">
        <p class="cremona-typography" data-variant="body" data-color="secondary">${t('theme.danger-zone.story.sample.description')}</p>
        <div class="cremona-danger-zone__confirmation">
          <label for="${id}-input" class="cremona-label">${t('theme.danger-zone.input.label', { expected })}</label>
          <input type="text"
                 id="${id}-input"
                 class="cremona-input cremona-danger-zone__input"
                 value="${preFilled}"
                 placeholder="${t('theme.danger-zone.input.placeholder')}"
                 autocomplete="off" spellcheck="false"
                 aria-describedby="${id}-help">
          <p id="${id}-help" class="cremona-danger-zone__help cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.danger-zone.input.help', { expected })}</p>
        </div>
      </div>
      <footer class="cremona-card__footer cremona-danger-zone__footer">
        <button type="button"
                class="cremona-button cremona-danger-zone__cta"
                data-variant="destructive" data-size="md"
                ${armed ? '' : 'disabled aria-disabled="true"'}>
          <span class="cremona-button__label">${t('theme.danger-zone.story.sample.cta')}</span>
        </button>
      </footer>
    </article>`;
}

function renderModalDangerZone({ id }) {
  return `
    <article class="cremona-card cremona-danger-zone"
             id="${id}"
             data-variant="elevated"
             data-danger-zone-variant="modal">
      <header class="cremona-card__header cremona-danger-zone__header">
        <h3 class="cremona-typography cremona-danger-zone__title" data-variant="h3">${t('theme.danger-zone.story.sample.title')}</h3>
      </header>
      <div class="cremona-card__body cremona-danger-zone__body">
        <p class="cremona-typography" data-variant="body" data-color="secondary">${t('theme.danger-zone.story.sample.description-modal')}</p>
      </div>
      <footer class="cremona-card__footer cremona-danger-zone__footer">
        <button type="button"
                class="cremona-button cremona-danger-zone__cta"
                data-variant="destructive" data-size="md"
                aria-controls="${id}-dialog">
          <span class="cremona-button__label">${t('theme.danger-zone.story.sample.cta')}</span>
        </button>
      </footer>
    </article>`;
}

const bodyHtml = `
  <section class="danger-zone-story" aria-labelledby="danger-zone-story-title">
    <header class="danger-zone-story__header">
      <h1 id="danger-zone-story-title">${t('theme.danger-zone.story.title')}</h1>
      <p>${t('theme.danger-zone.story.subtitle')}</p>
    </header>

    <section class="danger-zone-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.danger-zone.story.section.inline-default')}</h2>
      <p class="danger-zone-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.danger-zone.story.explainer.inline-default')}</p>
      <div class="danger-zone-story__frame">${renderInlineDangerZone({ id: 'story-inline-default', preFilled: '' })}</div>
    </section>

    <section class="danger-zone-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.danger-zone.story.section.inline-armed')}</h2>
      <p class="danger-zone-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.danger-zone.story.explainer.inline-armed')}</p>
      <div class="danger-zone-story__frame">${renderInlineDangerZone({ id: 'story-inline-armed', preFilled: 'SUPPRIMER' })}</div>
    </section>

    <section class="danger-zone-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.danger-zone.story.section.modal')}</h2>
      <p class="danger-zone-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.danger-zone.story.explainer.modal')}</p>
      <div class="danger-zone-story__frame">${renderModalDangerZone({ id: 'story-modal' })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/DangerZone" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="danger-zone-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="danger-zone-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.danger-zone-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.danger-zone-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.danger-zone-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.danger-zone-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.danger-zone-story__explainer { max-inline-size: 70ch; }
.danger-zone-story__frame { display: grid; gap: var(--spacing-4); padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); max-inline-size: 70ch; }
.danger-zone-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
