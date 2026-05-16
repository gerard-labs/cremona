<!--
  Onboarding-WelcomeScreens story — 4 viewport variants.
  Sections : step-1-of-3 · step-2-of-3 (middle) · step-3-of-3 (Finish CTA).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderIcon(name) {
  return `<svg class="theme-icon" data-size="lg" aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`;
}

function renderStepperItem({ idx, currentStep, label }) {
  const state = idx < currentStep ? 'done' : (idx === currentStep ? 'active' : 'upcoming');
  return `
    <li class="theme-stepper__step"${idx === currentStep ? ' aria-current="step"' : ''} data-state="${state}">
      <span class="theme-stepper__index">${idx + 1}</span>
      <span class="theme-stepper__label">${label}</span>
    </li>
  `;
}

function renderWelcome({ id = 'story-welcome', title, steps, currentStep = 0 }) {
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const step = steps[currentStep];
  return `
    <main class="theme-onboarding-welcome-screens" id="${id}">
      <article class="theme-card theme-onboarding-welcome-screens__card">
        <header class="theme-card__header theme-onboarding-welcome-screens__header">
          <h1 class="theme-typography theme-onboarding-welcome-screens__title" data-variant="h1">${title}</h1>
          <nav class="theme-onboarding-welcome-screens__stepper" aria-label="${t('theme.onboarding.welcome-screens.stepper.aria')}">
            <ol class="theme-stepper">
              ${steps.map((s, idx) => renderStepperItem({ idx, currentStep, label: s.heading })).join('')}
            </ol>
          </nav>
        </header>
        <div class="theme-card__body theme-onboarding-welcome-screens__body">
          <div class="theme-onboarding-welcome-screens__step-icon" aria-hidden="true">${renderIcon(step.icon)}</div>
          <h2 class="theme-typography theme-onboarding-welcome-screens__step-heading" data-variant="h2">${step.heading}</h2>
          <p class="theme-onboarding-welcome-screens__step-body">${step.body}</p>
        </div>
        <footer class="theme-card__footer theme-onboarding-welcome-screens__footer">
          <button type="button" class="theme-button theme-button--ghost theme-onboarding-welcome-screens__skip">${t('theme.onboarding.welcome-screens.skip')}</button>
          <div class="theme-onboarding-welcome-screens__nav">
            ${!isFirst ? `<button type="button" class="theme-button theme-button--outline">${t('theme.onboarding.welcome-screens.previous')}</button>` : ''}
            <button type="button" class="theme-button theme-button--primary">${isLast ? t('theme.onboarding.welcome-screens.finish') : t('theme.onboarding.welcome-screens.next')}</button>
          </div>
        </footer>
      </article>
    </main>
  `;
}

const title = t('theme.onboarding.welcome-screens.title');
const steps = [
  { heading: t('theme.onboarding.welcome-screens.story.step.1.heading'), body: t('theme.onboarding.welcome-screens.story.step.1.body'), icon: 'star' },
  { heading: t('theme.onboarding.welcome-screens.story.step.2.heading'), body: t('theme.onboarding.welcome-screens.story.step.2.body'), icon: 'option' },
  { heading: t('theme.onboarding.welcome-screens.story.step.3.heading'), body: t('theme.onboarding.welcome-screens.story.step.3.body'), icon: 'check' },
];

const bodyHtml = `
  <section class="onboarding-welcome-story" aria-labelledby="onboarding-welcome-story-title">
    <header class="onboarding-welcome-story__header">
      <h1 id="onboarding-welcome-story-title">${t('theme.onboarding.welcome-screens.story.title')}</h1>
      <p>${t('theme.onboarding.welcome-screens.story.subtitle')}</p>
    </header>

    <section class="onboarding-welcome-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.onboarding.welcome-screens.story.section.step-1')}</h2>
      <div class="onboarding-welcome-story__frame">${renderWelcome({ id: 'story-step-1', title, steps, currentStep: 0 })}</div>
    </section>

    <section class="onboarding-welcome-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.onboarding.welcome-screens.story.section.step-2')}</h2>
      <div class="onboarding-welcome-story__frame">${renderWelcome({ id: 'story-step-2', title, steps, currentStep: 1 })}</div>
    </section>

    <section class="onboarding-welcome-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.onboarding.welcome-screens.story.section.step-3')}</h2>
      <div class="onboarding-welcome-story__frame">${renderWelcome({ id: 'story-step-3', title, steps, currentStep: 2 })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Onboarding-WelcomeScreens" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="onboarding-welcome-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="onboarding-welcome-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.onboarding-welcome-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.onboarding-welcome-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.onboarding-welcome-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.onboarding-welcome-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.onboarding-welcome-story__frame { min-block-size: 36rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; }
.onboarding-welcome-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
