<!--
  Stepper story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6):
    1. Horizontal default (currentStep=2 / 4) — completed + current + upcoming.
    2. Horizontal sizes (sm / md / lg) — 3 paired.
    3. Vertical orientation — long descriptive flow.
    4. With disabled step — one step opt-out of the flow.
    5. Interactive demo — buttons increment / decrement currentStep.
    6. Events log — wired to stepper:step-change demonstration.

  Helpers (per S2.3a story doctrine — nested template literal avoidance):
    - stepper({ id, currentStep, totalSteps, orientation, size, items, label })
    - button({ label, onclickAttr }) for the demo controls.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);

  // Wire the interactive demo : prev / next buttons mutate currentStepValue.
  const demoStepper = document.getElementById('stp-interactive');
  if (demoStepper && demoStepper.__themeApp == null) {
    const ctrl = () => {
      const app = document.documentElement.__themeApp;
      if (!app) return null;
      return app.controllers.find((c) => c.identifier === 'stepper' && c.element === demoStepper);
    };
    const updateLabel = () => {
      const c = ctrl();
      const label = document.querySelector('[data-demo-current-label]');
      if (c && label) {
        label.textContent = `${c.currentStepValue} / ${c.totalStepsValue}`;
      }
    };
    document.querySelector('[data-demo-prev]')?.addEventListener('click', () => {
      const c = ctrl();
      if (c && c.currentStepValue > 1) c.currentStepValue = c.currentStepValue - 1;
      updateLabel();
    });
    document.querySelector('[data-demo-next]')?.addEventListener('click', () => {
      const c = ctrl();
      if (c && c.currentStepValue <= c.totalStepsValue) c.currentStepValue = c.currentStepValue + 1;
      updateLabel();
    });
    updateLabel();
  }

  // Wire the events log demo.
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const id = log.getAttribute('data-events-log');
    const wrap = document.getElementById(id);
    if (!wrap) continue;
    const out = log.querySelector('[data-events-out]');
    wrap.addEventListener('stepper:step-change', (e) => {
      const d = e.detail;
      const line = document.createElement('div');
      const completedMark = d.completed ? ' ✓ completed' : '';
      line.textContent = `stepper:step-change → ${d.previousStep} → ${d.currentStep} / ${d.totalSteps}${completedMark}`;
      if (out) out.appendChild(line);
    });
  }
});

let _stpCounter = 0;
function nextId(prefix = 'stp') { return `${prefix}-${++_stpCounter}`; }

function S(key) { return t('theme.stepper.story.' + key); }

function stepper({
  id,
  currentStep = 1,
  totalSteps = null,
  orientation = 'horizontal',
  size = 'md',
  label = null,
  items = [],
}) {
  const wrapId = id || nextId('stp');
  const total = totalSteps != null ? totalSteps : items.length;
  const stepsHtml = items.map((it, i) => {
    const idx = i + 1;
    const isDisabled = !!it.disabled;
    let state;
    if (isDisabled) state = 'disabled';
    else if (idx < currentStep) state = 'completed';
    else if (idx === currentStep) state = 'current';
    else state = 'upcoming';
    const ariaCur = state === 'current' ? ' aria-current="step"' : '';
    const desc = it.description
      ? `<span class="theme-stepper__description">${it.description}</span>`
      : '';
    return `<li id="${wrapId}-step-${idx}" class="theme-stepper__step"
      data-stepper-target="step"
      data-step-index="${idx}"
      data-state="${state}"${ariaCur}>
      <span class="theme-stepper__indicator" aria-hidden="true">
        <span class="theme-stepper__indicator-number">${idx}</span>
        <span class="theme-stepper__indicator-check"></span>
      </span>
      <div class="theme-stepper__text">
        <span class="theme-stepper__label">${it.label}</span>${desc}
      </div>
    </li>`;
  }).join('');
  const lbl = label || S('default-label');
  return `<ol id="${wrapId}" class="theme-stepper"
    data-controller="stepper"
    data-stepper-current-step-value="${currentStep}"
    data-stepper-total-steps-value="${total}"
    data-orientation="${orientation}"
    data-size="${size}"
    aria-label="${lbl}">${stepsHtml}</ol>`;
}

const onboardingItems = [
  { label: S('item.account'),      description: S('desc.account') },
  { label: S('item.profile'),      description: S('desc.profile') },
  { label: S('item.preferences'),  description: S('desc.preferences') },
  { label: S('item.confirmation'), description: S('desc.confirmation') },
];

const sizeItems = [
  { label: S('item.short-a') },
  { label: S('item.short-b') },
  { label: S('item.short-c') },
];

const verticalItems = [
  { label: S('item.kyc'),       description: S('desc.kyc') },
  { label: S('item.docs'),      description: S('desc.docs') },
  { label: S('item.review'),    description: S('desc.review') },
  { label: S('item.signature'), description: S('desc.signature') },
  { label: S('item.success'),   description: S('desc.success') },
];

const disabledItems = [
  { label: S('item.cart') },
  { label: S('item.shipping') },
  { label: S('item.payment'), disabled: true },
  { label: S('item.confirm') },
];

const bodyHtml = `
  <section class="stp-story" data-testid="stepper-root">
    <header class="stp-story__header">
      <h1>${t('theme.stepper.story.title')}</h1>
      <p>${t('theme.stepper.story.subtitle')}</p>
    </header>

    <section class="stp-story__section" aria-labelledby="stp-section-default">
      <h2 id="stp-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="stp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      ${stepper({ currentStep: 2, items: onboardingItems, label: S('aria.account') })}
    </section>

    <section class="stp-story__section" aria-labelledby="stp-section-sizes">
      <h2 id="stp-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.sizes')}</h2>
      <p class="stp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.sizes')}</p>
      <div class="stp-story__col">
        <div class="stp-story__size-label">${S('size.sm')}</div>
        ${stepper({ currentStep: 2, items: sizeItems, size: 'sm', label: S('aria.sm') })}
      </div>
      <div class="stp-story__col">
        <div class="stp-story__size-label">${S('size.md')}</div>
        ${stepper({ currentStep: 2, items: sizeItems, size: 'md', label: S('aria.md') })}
      </div>
      <div class="stp-story__col">
        <div class="stp-story__size-label">${S('size.lg')}</div>
        ${stepper({ currentStep: 2, items: sizeItems, size: 'lg', label: S('aria.lg') })}
      </div>
    </section>

    <section class="stp-story__section" aria-labelledby="stp-section-vertical">
      <h2 id="stp-section-vertical" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.vertical')}</h2>
      <p class="stp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.vertical')}</p>
      ${stepper({ currentStep: 3, items: verticalItems, orientation: 'vertical', label: S('aria.vertical') })}
    </section>

    <section class="stp-story__section" aria-labelledby="stp-section-disabled">
      <h2 id="stp-section-disabled" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.disabled')}</h2>
      <p class="stp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.disabled')}</p>
      ${stepper({ currentStep: 2, items: disabledItems, label: S('aria.disabled') })}
    </section>

    <section class="stp-story__section" aria-labelledby="stp-section-interactive">
      <h2 id="stp-section-interactive" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.interactive')}</h2>
      <p class="stp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.interactive')}</p>
      ${stepper({ id: 'stp-interactive', currentStep: 1, items: onboardingItems, label: S('aria.interactive') })}
      <div class="stp-story__controls">
        <button type="button" class="theme-button" data-variant="secondary" data-size="sm" data-demo-prev>${S('control.prev')}</button>
        <span class="stp-story__counter" data-demo-current-label>1 / 4</span>
        <button type="button" class="theme-button" data-variant="primary" data-size="sm" data-demo-next>${S('control.next')}</button>
      </div>
    </section>

    <section class="stp-story__section" aria-labelledby="stp-section-events">
      <h2 id="stp-section-events" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="stp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      <div class="stp-story__log" data-events-log="stp-interactive">
        <div class="theme-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-events-out class="stp-story__log-out"></div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Stepper" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="stp-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="stp-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.stp-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.stp-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.stp-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.stp-story__section { display: grid; gap: var(--spacing-4); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.stp-story__explainer { max-inline-size: 70ch; }
.stp-story__col { display: grid; gap: var(--spacing-2); }
.stp-story__size-label { font: var(--typography-caption); color: var(--color-text-tertiary); }
.stp-story__controls { display: flex; align-items: center; gap: var(--spacing-3); justify-content: center; padding-block-start: var(--spacing-2); }
.stp-story__counter { font: var(--typography-caption); color: var(--color-text-secondary); min-inline-size: 60px; text-align: center; font-variant-numeric: tabular-nums; }
.stp-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.stp-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.stp-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
