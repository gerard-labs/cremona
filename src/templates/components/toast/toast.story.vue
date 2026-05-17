<!--
  Toast story — focused JS API demo (Ring 2).

  Toast is the consumer-facing surface ; Sonner is the engine. This
  story emphasizes the JS API call pattern (`window.themeToast.show`)
  as the headline. For comprehensive coverage (stacking, undo, pause,
  Esc, events log), see sonner.story.vue.

  Sections (2):
    1. JS API call (window.themeToast.show) — 4 variant buttons + 1
       success+undo button. Demonstrates the canonical consumer code.
    2. DOM event call (document.dispatchEvent) — single button shows
       the no-coupling path works for legacy / sprinkle-script consumers.

  The viewport is auto-injected by boot() — no separate viewport markup
  here.
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

  if (typeof window === 'undefined') return;
  if (window.__themeToastDemoWired) return;
  window.__themeToastDemoWired = true;

  document.addEventListener('click', (e) => {
    const trigger = e.target && e.target.closest && e.target.closest('[data-toast-demo]');
    if (!trigger) return;
    const demo = trigger.dataset.toastDemo;
    if (!demo) return;

    switch (demo) {
      case 'js-success':
        window.themeToast.show({
          variant: 'success',
          message: t('theme.toast.story.sample.js-success-message'),
        });
        break;
      case 'js-info':
        window.themeToast.show({
          variant: 'info',
          message: t('theme.toast.story.sample.js-info-message'),
        });
        break;
      case 'js-warning':
        window.themeToast.show({
          variant: 'warning',
          message: t('theme.toast.story.sample.js-warning-message'),
        });
        break;
      case 'js-danger':
        window.themeToast.show({
          variant: 'danger',
          message: t('theme.toast.story.sample.js-danger-message'),
        });
        break;
      case 'js-undo':
        window.themeToast.show({
          variant: 'success',
          message: t('theme.toast.story.sample.js-undo-message'),
          undoLabel: t('theme.toast.story.sample.js-undo-label'),
          undoCallback: () => {
            window.themeToast.show({
              variant: 'info',
              message: t('theme.toast.story.sample.js-undo-callback-confirm'),
              duration: 3000,
            });
          },
        });
        break;
      case 'event-show':
        document.dispatchEvent(
          new CustomEvent('theme:toast:show', {
            detail: {
              variant: 'success',
              message: t('theme.toast.story.sample.event-message'),
            },
          }),
        );
        break;
    }
  });
});

const SEP = '\n      ';

function btn(label, demoKey, variant = 'primary') {
  return `<button type="button" class="cremona-button" data-variant="${variant}" data-toast-demo="${demoKey}"><span class="cremona-button__label">${label}</span></button>`;
}

const jsRow = [
  btn(t('theme.toast.story.sample.js-success-trigger'), 'js-success', 'primary'),
  btn(t('theme.toast.story.sample.js-info-trigger'), 'js-info', 'secondary'),
  btn(t('theme.toast.story.sample.js-warning-trigger'), 'js-warning', 'secondary'),
  btn(t('theme.toast.story.sample.js-danger-trigger'), 'js-danger', 'destructive'),
  btn(t('theme.toast.story.sample.js-undo-trigger'), 'js-undo', 'destructive'),
].join(SEP);

const eventRow = btn(t('theme.toast.story.sample.event-trigger'), 'event-show', 'primary');

const bodyHtml = `
  <section class="toast-story" data-testid="toast-root">
    <header class="toast-story__header">
      <h1>${t('theme.toast.story.title')}</h1>
      <p>${t('theme.toast.story.subtitle')}</p>
    </header>

    <section class="toast-story__section" aria-labelledby="toast-section-js">
      <h2 id="toast-section-js" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.toast.story.section.js-api')}</h2>
      <p class="toast-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.toast.story.explainer.js-api')}</p>
      <div class="toast-story__row">${SEP}${jsRow}${SEP}</div>
    </section>

    <section class="toast-story__section" aria-labelledby="toast-section-event">
      <h2 id="toast-section-event" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.toast.story.section.event-api')}</h2>
      <p class="toast-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.toast.story.explainer.event-api')}</p>
      <div class="toast-story__row">${SEP}${eventRow}${SEP}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Toast" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="toast-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="toast-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.toast-story {
  display: grid;
  gap: var(--spacing-8);
  padding: var(--spacing-6);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  min-block-size: 100vh;
}
.toast-story__header h1 {
  font: var(--typography-h1);
  margin-block-end: var(--spacing-2);
}
.toast-story__header p {
  font: var(--typography-body);
  color: var(--color-text-secondary);
  max-inline-size: 70ch;
}
.toast-story__section {
  display: grid;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}
.toast-story__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  padding-block: var(--spacing-2);
  align-items: center;
}
.toast-story__explainer {
  max-inline-size: 70ch;
}
.toast-dark-wrap {
  background: var(--color-bg-base);
  min-block-size: 100vh;
}
</style>
