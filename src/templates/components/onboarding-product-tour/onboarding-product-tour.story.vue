<!--
  Onboarding-ProductTour story — 4 viewport variants.
  Sections : trigger-idle · with-3-steps · auto-start-demo.
-->
<script setup>
import { onMounted } from 'vue';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

function renderProductTour({ id = 'story-product-tour', triggerLabel, steps, autoStart = false }) {
  return `
    <div class="cremona-onboarding-product-tour" id="${id}"
         data-controller="product-tour"
         data-product-tour-steps-value='${JSON.stringify(steps)}'
         data-product-tour-auto-start-value="${autoStart}"
         data-product-tour-show-progress-value="true"
         data-product-tour-state="idle">
      <button type="button" class="cremona-button cremona-button--primary"
              data-product-tour-target="trigger"
              data-action="click->product-tour#start">${triggerLabel}</button>
    </div>
  `;
}

const triggerLabel = t('theme.onboarding.product-tour.trigger');
const stepsBasic = [
  { element: '#story-anchor-1', popover: { title: t('theme.onboarding.product-tour.story.step.1.title'), description: t('theme.onboarding.product-tour.story.step.1.body') } },
  { element: '#story-anchor-2', popover: { title: t('theme.onboarding.product-tour.story.step.2.title'), description: t('theme.onboarding.product-tour.story.step.2.body') } },
  { element: '#story-anchor-3', popover: { title: t('theme.onboarding.product-tour.story.step.3.title'), description: t('theme.onboarding.product-tour.story.step.3.body') } },
];

const bodyHtml = `
  <section class="onboarding-product-tour-story" aria-labelledby="onboarding-product-tour-story-title">
    <header class="onboarding-product-tour-story__header">
      <h1 id="onboarding-product-tour-story-title">${t('theme.onboarding.product-tour.story.title')}</h1>
      <p>${t('theme.onboarding.product-tour.story.subtitle')}</p>
    </header>

    <section class="onboarding-product-tour-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.onboarding.product-tour.story.section.trigger')}</h2>
      <p class="onboarding-product-tour-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.onboarding.product-tour.story.explainer.trigger')}</p>
      <div class="onboarding-product-tour-story__frame">
        <div class="onboarding-product-tour-story__anchors">
          <div id="story-anchor-1" class="onboarding-product-tour-story__anchor">A</div>
          <div id="story-anchor-2" class="onboarding-product-tour-story__anchor">B</div>
          <div id="story-anchor-3" class="onboarding-product-tour-story__anchor">C</div>
        </div>
        ${renderProductTour({ id: 'story-trigger', triggerLabel, steps: stepsBasic })}
      </div>
    </section>

    <section class="onboarding-product-tour-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.onboarding.product-tour.story.section.events')}</h2>
      <p class="onboarding-product-tour-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.onboarding.product-tour.story.explainer.events')}</p>
      <div class="onboarding-product-tour-story__frame">
        <p>${t('theme.onboarding.product-tour.story.events-list')}</p>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Onboarding/Product Tour" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="onboarding-product-tour-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="onboarding-product-tour-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.onboarding-product-tour-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.onboarding-product-tour-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.onboarding-product-tour-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.onboarding-product-tour-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.onboarding-product-tour-story__explainer { max-inline-size: 70ch; }
.onboarding-product-tour-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); display: grid; gap: var(--spacing-4); }
.onboarding-product-tour-story__anchors { display: flex; gap: var(--spacing-4); }
.onboarding-product-tour-story__anchor { inline-size: 60px; block-size: 60px; border-radius: var(--radius-md); background-color: var(--color-primary-soft); color: var(--color-primary-soft-foreground); display: flex; align-items: center; justify-content: center; font-weight: var(--font-weight-bold); }
.onboarding-product-tour-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
