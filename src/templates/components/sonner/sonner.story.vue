<!--
  Sonner story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6):
    1. Variantes — 4 trigger buttons, one per variant. Defaults visible:
                   success auto-dismisses in 4s, info stays persistent,
                   warning dismisses in 6s, danger stays persistent.
    2. Success + Undo (10s) — trigger pushes a success toast with Undo
                              button; 10s window. Undo no-op callback
                              just logs the event.
    3. Stacking max-5 + queue — "Push 8" button pushes 8 toasts in a row;
                                viewport shows the 5 newest + "+3 autres"
                                indicator. Click indicator expands queue.
    4. Pause on hover — trigger pushes a 4s success; user can hover the
                        viewport to freeze the timer. No story-side
                        countdown indicator (production behavior is
                        invisible — the user just sees that the toast
                        stays).
    5. Esc dismiss-all — pushes 3 toasts; user presses Esc; all dismiss.
                         This section ships its own keydown hint near
                         the trigger so the user knows what to do.
    6. Démo events — 3 buttons (Show / Dismiss-last / DismissAll); an
                     <output> log captures sonner:show / :dismiss /
                     :undo events with detail.

  Wiring: a single document-level click delegation reads data-sonner-demo
  attributes from the triggers and dispatches the matching window.theme
  Toast call. Idempotent guard (window.__themeSonnerDemoWired) prevents
  HMR double-registration.

  No Stimulus action on the trigger buttons themselves (because there's
  no plain action that maps to a parameterized window.themeToast.show()
  call) — the document-delegated listener is the cleanest path.

  The viewport is auto-injected by boot() (which calls ensureSonnerView
  port). The story content lives in `<section class="sonner-story">` ;
  the viewport sits at `<body>` end, fixed bottom-end.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

// Bus of fake names used by the stacking demo to make the 8 queued toasts
// distinguishable (so the user can verify max-5 + queue logic visually).
const STACK_NAMES = ['Arcelor', 'Vinci', 'Bouygues', 'Orange', 'Renault', 'Capgemini', 'Atos', 'SAP'];

let _undoCallbackCount = 0;
function makeUndoCallback(label) {
  // Returns a function that pushes a follow-up toast confirming the undo
  // (so the user can see the callback ran). Story-only behavior — real
  // consumer callbacks roll back the original action.
  return () => {
    _undoCallbackCount++;
    if (typeof window !== 'undefined' && window.themeToast) {
      window.themeToast.show({
        variant: 'info',
        message: t('theme.sonner.story.sample.undo-callback-confirm', { label }),
        duration: 3000,
      });
    }
  };
}

onMounted(() => {
  boot(document.documentElement);

  if (typeof window === 'undefined') return;
  if (window.__themeSonnerDemoWired) return;
  window.__themeSonnerDemoWired = true;

  // ===== Click delegation: trigger buttons → window.themeToast.show() ===
  document.addEventListener('click', (e) => {
    const trigger = e.target && e.target.closest && e.target.closest('[data-sonner-demo]');
    if (!trigger) return;
    const demo = trigger.dataset.sonnerDemo;
    if (!demo || !window.themeToast) return;

    switch (demo) {
      case 'success':
        window.themeToast.show({
          variant: 'success',
          message: t('theme.sonner.story.sample.success-message'),
        });
        break;
      case 'info':
        window.themeToast.show({
          variant: 'info',
          title: t('theme.sonner.story.sample.info-title'),
          message: t('theme.sonner.story.sample.info-message'),
        });
        break;
      case 'warning':
        window.themeToast.show({
          variant: 'warning',
          message: t('theme.sonner.story.sample.warning-message'),
        });
        break;
      case 'danger':
        window.themeToast.show({
          variant: 'danger',
          title: t('theme.sonner.story.sample.danger-title'),
          message: t('theme.sonner.story.sample.danger-message'),
        });
        break;
      case 'success-with-undo': {
        const label = t('theme.sonner.story.sample.undo-resource');
        window.themeToast.show({
          variant: 'success',
          message: t('theme.sonner.story.sample.undo-message', { name: label }),
          undoLabel: t('theme.sonner.story.sample.undo-label'),
          undoCallback: makeUndoCallback(label),
        });
        break;
      }
      case 'stack-8':
        for (let i = 0; i < 8; i++) {
          const name = STACK_NAMES[i % STACK_NAMES.length];
          window.themeToast.show({
            variant: 'success',
            message: t('theme.sonner.story.sample.stack-message', { name }),
            duration: null, // persistent so the user can inspect the stack
          });
        }
        break;
      case 'pause-success':
        window.themeToast.show({
          variant: 'success',
          message: t('theme.sonner.story.sample.pause-message'),
        });
        break;
      case 'esc-burst':
        for (let i = 0; i < 3; i++) {
          window.themeToast.show({
            variant: 'info',
            message: t('theme.sonner.story.sample.esc-message', { index: i + 1 }),
            duration: null,
          });
        }
        break;
      case 'events-show':
        window.themeToast.show({
          variant: 'success',
          message: t('theme.sonner.story.sample.events-show-message'),
          undoLabel: t('theme.sonner.story.sample.events-undo-label'),
          undoCallback: makeUndoCallback(t('theme.sonner.story.sample.events-undo-label')),
        });
        break;
      case 'events-dismiss-all':
        window.themeToast.dismissAll();
        break;
    }
  });

  // ===== Events log wiring (section 6) ===
  document.addEventListener('sonner:show', (e) => appendLog('sonner:show', e.detail));
  document.addEventListener('sonner:dismiss', (e) => appendLog('sonner:dismiss', e.detail));
  document.addEventListener('sonner:undo', (e) => appendLog('sonner:undo', e.detail));

  function appendLog(name, detail) {
    const log = document.querySelector('[data-sonner-events-log]');
    if (!log) return;
    if (log.dataset.empty === '1') {
      log.textContent = '';
      log.dataset.empty = '0';
    }
    const detailStr = detail
      ? ' ' + JSON.stringify(detail).replace(/[<>]/g, '')
      : '';
    log.textContent += name + detailStr + '\n';
    log.scrollTop = log.scrollHeight;
  }
});

// ============================================================
// Helpers — wrap content fragments so check-i18n's brace-balanced
// masker can clearly distinguish ${t(...)} interpolations from
// raw text. Pattern documented in STATE.md S2.3a Choices made.
// ============================================================
const SEP = '\n      ';

function btn(label, demoKey, opts = {}) {
  const variant = opts.variant || 'primary';
  return `<button type="button" class="cremona-button" data-variant="${variant}" data-sonner-demo="${demoKey}"><span class="cremona-button__label">${label}</span></button>`;
}

function section(id, sectionKey, explainerKey, inner) {
  const label = t(sectionKey);
  const explain = t(explainerKey);
  return `<section class="sonner-story__section" aria-labelledby="sonner-section-${id}">
      <h2 id="sonner-section-${id}" class="cremona-typography" data-variant="overline" data-color="tertiary">${label}</h2>
      <p class="sonner-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${explain}</p>
      ${inner}
    </section>`;
}

const variantsRow = [
  btn(t('theme.sonner.story.sample.success-trigger'), 'success', { variant: 'primary' }),
  btn(t('theme.sonner.story.sample.info-trigger'), 'info', { variant: 'secondary' }),
  btn(t('theme.sonner.story.sample.warning-trigger'), 'warning', { variant: 'secondary' }),
  btn(t('theme.sonner.story.sample.danger-trigger'), 'danger', { variant: 'destructive' }),
].join(SEP);

const undoRow = btn(t('theme.sonner.story.sample.undo-trigger'), 'success-with-undo', { variant: 'destructive' });

const stackRow = btn(t('theme.sonner.story.sample.stack-trigger'), 'stack-8', { variant: 'primary' });

const pauseRow = [
  btn(t('theme.sonner.story.sample.pause-trigger'), 'pause-success', { variant: 'primary' }),
  `<span class="sonner-story__hint cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.sonner.story.sample.pause-hint')}</span>`,
].join(SEP);

const escRow = [
  btn(t('theme.sonner.story.sample.esc-trigger'), 'esc-burst', { variant: 'secondary' }),
  `<span class="sonner-story__hint cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.sonner.story.sample.esc-hint')}</span>`,
].join(SEP);

const eventsRow = [
  btn(t('theme.sonner.story.sample.events-show-trigger'), 'events-show', { variant: 'primary' }),
  btn(t('theme.sonner.story.sample.events-dismiss-all-trigger'), 'events-dismiss-all', { variant: 'secondary' }),
].join(SEP);

const eventsLog = `<div class="sonner-story__events-log">
      <span class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.sonner.story.sample.events-log-label')}</span>
      <pre class="sonner-story__events-log-output" data-sonner-events-log data-empty="1">${t('theme.sonner.story.sample.events-log-empty')}</pre>
    </div>`;

const bodyHtml = `
  <section class="sonner-story" data-testid="sonner-root">
    <header class="sonner-story__header">
      <h1>${t('theme.sonner.story.title')}</h1>
      <p>${t('theme.sonner.story.subtitle')}</p>
    </header>

    ${section('variants', 'theme.sonner.story.section.variants', 'theme.sonner.story.explainer.variants',
      `<div class="sonner-story__row">${SEP}${variantsRow}${SEP}</div>`)}

    ${section('undo', 'theme.sonner.story.section.undo', 'theme.sonner.story.explainer.undo',
      `<div class="sonner-story__row">${SEP}${undoRow}${SEP}</div>`)}

    ${section('stack', 'theme.sonner.story.section.stack', 'theme.sonner.story.explainer.stack',
      `<div class="sonner-story__row">${SEP}${stackRow}${SEP}</div>`)}

    ${section('pause', 'theme.sonner.story.section.pause', 'theme.sonner.story.explainer.pause',
      `<div class="sonner-story__row sonner-story__row--with-hint">${SEP}${pauseRow}${SEP}</div>`)}

    ${section('esc', 'theme.sonner.story.section.esc', 'theme.sonner.story.explainer.esc',
      `<div class="sonner-story__row sonner-story__row--with-hint">${SEP}${escRow}${SEP}</div>`)}

    ${section('events', 'theme.sonner.story.section.events', 'theme.sonner.story.explainer.events',
      `<div class="sonner-story__row">${SEP}${eventsRow}${SEP}</div>
      ${eventsLog}`)}
  </section>
`;
</script>

<template>
  <Story title="Sonner" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="sonner-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="sonner-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.sonner-story {
  display: grid;
  gap: var(--spacing-8);
  padding: var(--spacing-6);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  min-block-size: 100vh;
}
.sonner-story__header h1 {
  font: var(--typography-h1);
  margin-block-end: var(--spacing-2);
}
.sonner-story__header p {
  font: var(--typography-body);
  color: var(--color-text-secondary);
  max-inline-size: 70ch;
}
.sonner-story__section {
  display: grid;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}
.sonner-story__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  padding-block: var(--spacing-2);
  align-items: center;
}
.sonner-story__row--with-hint {
  align-items: baseline;
}
.sonner-story__explainer {
  max-inline-size: 70ch;
}
.sonner-story__hint {
  max-inline-size: 60ch;
}
.sonner-story__events-log {
  display: grid;
  gap: var(--spacing-1);
  margin-block-start: var(--spacing-3);
}
.sonner-story__events-log-output {
  font: var(--typography-code);
  background: var(--color-bg-sunken);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  padding: var(--spacing-2);
  min-block-size: 100px;
  max-block-size: 220px;
  overflow: auto;
  white-space: pre;
  color: var(--color-text-secondary);
}
.sonner-story__events-log-output[data-empty="1"] {
  color: var(--color-text-tertiary);
  font-style: italic;
}
.sonner-dark-wrap {
  background: var(--color-bg-base);
  min-block-size: 100vh;
}
</style>
