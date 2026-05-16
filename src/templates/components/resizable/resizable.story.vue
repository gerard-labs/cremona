<!--
  Resizable story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Horizontal 50/50 — default split.
    2. Vertical 50/50 — vertical split.
    3. With min/max — clamp 20-70%.
    4. Composed (editor + preview) — typical IDE pattern.
    5. Events log demo — wire resizable:change to a visible log.

  Stimulus controller `resizable` mounted on the wrap. Per OQ-36 sealed
  S2.4 opening: event-only persistence — the consumer chooses to persist.

  Helpers (per S2.3a story doctrine):
    - resizable({ id, orientation, size, minSize, maxSize, start, end, ... })
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
  for (const log of document.querySelectorAll('[data-rs-events-log]')) {
    const id = log.getAttribute('data-rs-events-log');
    const wrap = document.getElementById(id);
    if (!wrap) continue;
    const out = log.querySelector('[data-rs-events-out]');
    wrap.addEventListener('resizable:change', (e) => {
      const d = e.detail;
      const line = document.createElement('div');
      line.textContent = `resizable:change → size=${d.size.toFixed(1)}%, orientation=${d.orientation}`;
      if (out) out.appendChild(line);
    });
  }
});

let _rsCounter = 0;
function nextId(prefix = 'rs') { return `${prefix}-${++_rsCounter}`; }

function S(key) { return t('theme.resizable.story.' + key); }

function resizable({ id, orientation = 'horizontal', size = 50, minSize = 10, maxSize = 90, step = 5, start, end, className = '' }) {
  const wrapId = id || nextId('rs');
  return `
    <div
      id="${wrapId}"
      class="cremona-resizable ${className}"
      data-orientation="${orientation}"
      data-controller="resizable"
      data-resizable-orientation-value="${orientation}"
      data-resizable-size-value="${size}"
      data-resizable-min-size-value="${minSize}"
      data-resizable-max-size-value="${maxSize}"
      data-resizable-step-value="${step}"
      style="--cremona-resizable-size: ${size}%;"
    >
      <div id="${wrapId}-start" class="cremona-resizable__pane cremona-resizable__pane--start" data-resizable-target="startPane">${start}</div>
      <div
        class="cremona-resizable__handle"
        data-resizable-target="handle"
        role="separator"
        aria-orientation="${orientation}"
        aria-controls="${wrapId}-start"
        aria-label="${S('aria.handle')}"
        tabindex="0"
      ><span class="cremona-resizable__grip" aria-hidden="true"></span></div>
      <div class="cremona-resizable__pane cremona-resizable__pane--end">${end}</div>
    </div>
  `;
}

function paneContent({ title, body, bg = 'sunken' }) {
  return `<div class="rs-story__pane" data-bg="${bg}">
    <h3 class="cremona-typography" data-variant="h3">${title}</h3>
    <p class="cremona-typography" data-variant="body">${body}</p>
  </div>`;
}

const bodyHtml = `
  <section class="rs-story" data-testid="resizable-root">
    <header class="rs-story__header">
      <h1>${t('theme.resizable.story.title')}</h1>
      <p>${t('theme.resizable.story.subtitle')}</p>
    </header>

    <section class="rs-story__section" aria-labelledby="rs-section-horizontal">
      <h2 id="rs-section-horizontal" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.horizontal')}</h2>
      <p class="rs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.horizontal')}</p>
      <div class="rs-story__container">
        ${resizable({
          orientation: 'horizontal',
          size: 50,
          start: paneContent({ title: S('pane.left'), body: S('pane.body-left') }),
          end: paneContent({ title: S('pane.right'), body: S('pane.body-right'), bg: 'elevated' }),
        })}
      </div>
    </section>

    <section class="rs-story__section" aria-labelledby="rs-section-vertical">
      <h2 id="rs-section-vertical" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.vertical')}</h2>
      <p class="rs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.vertical')}</p>
      <div class="rs-story__container rs-story__container--tall">
        ${resizable({
          orientation: 'vertical',
          size: 50,
          start: paneContent({ title: S('pane.top'), body: S('pane.body-top') }),
          end: paneContent({ title: S('pane.bottom'), body: S('pane.body-bottom'), bg: 'elevated' }),
        })}
      </div>
    </section>

    <section class="rs-story__section" aria-labelledby="rs-section-clamp">
      <h2 id="rs-section-clamp" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.clamp')}</h2>
      <p class="rs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.clamp')}</p>
      <div class="rs-story__container">
        ${resizable({
          orientation: 'horizontal',
          size: 30,
          minSize: 20,
          maxSize: 70,
          start: paneContent({ title: S('pane.constrained'), body: S('pane.body-constrained') }),
          end: paneContent({ title: S('pane.flexible'), body: S('pane.body-flexible'), bg: 'elevated' }),
        })}
      </div>
    </section>

    <section class="rs-story__section" aria-labelledby="rs-section-editor">
      <h2 id="rs-section-editor" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.editor')}</h2>
      <p class="rs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.editor')}</p>
      <div class="rs-story__container rs-story__container--tall">
        ${resizable({
          orientation: 'horizontal',
          size: 50,
          minSize: 25,
          maxSize: 75,
          start: paneContent({ title: S('pane.editor'), body: S('pane.body-editor') }),
          end: paneContent({ title: S('pane.preview'), body: S('pane.body-preview'), bg: 'elevated' }),
        })}
      </div>
    </section>

    <section class="rs-story__section" aria-labelledby="rs-section-events">
      <h2 id="rs-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="rs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      <div class="rs-story__container">
        ${resizable({
          id: 'rs-events-demo',
          orientation: 'horizontal',
          size: 50,
          start: paneContent({ title: S('pane.demo-start'), body: S('pane.body-demo') }),
          end: paneContent({ title: S('pane.demo-end'), body: S('pane.body-demo'), bg: 'elevated' }),
        })}
      </div>
      <div class="rs-story__log" data-rs-events-log="rs-events-demo">
        <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-rs-events-out class="rs-story__log-out"></div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Resizable" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="rs-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="rs-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.rs-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.rs-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.rs-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.rs-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.rs-story__explainer { max-inline-size: 70ch; }
.rs-story__container { block-size: 240px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; }
.rs-story__container--tall { block-size: 360px; }
.rs-story__pane { padding: var(--spacing-4); }
.rs-story__pane[data-bg="elevated"] { background: var(--color-bg-elevated); }
.rs-story__pane[data-bg="sunken"] { background: var(--color-bg-sunken); }
.rs-story__pane h3 { margin-block: 0 var(--spacing-2); }
.rs-story__pane p { margin: 0; color: var(--color-text-secondary); }
.rs-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.rs-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.rs-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
