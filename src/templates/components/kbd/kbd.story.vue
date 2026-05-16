<!--
  Kbd story — 4 viewport variants. Single key, chord, sequence, symbol
  chord with sr-only expansion, inline-in-help-text, sizes sm/md.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderKbd({ keys, separator = '+', size = 'sm', className }) {
  const arr = Array.isArray(keys) ? keys : [keys];
  const classes = ['theme-kbd-group'];
  if (className) classes.push(className);
  const inner = arr
    .map(
      (k, i) =>
        `<kbd class="theme-kbd" data-size="${size}">${k}</kbd>${
          i < arr.length - 1
            ? `<span class="theme-kbd-sep" aria-hidden="true">${separator}</span>`
            : ''
        }`,
    )
    .join('');
  return `<kbd class="${classes.join(' ')}" data-size="${size}">${inner}</kbd>`;
}

const bodyHtml = `
  <section class="kbd-story" data-testid="kbd-root">
    <header class="kbd-story__header">
      <h1>${t('theme.kbd.story.title')}</h1>
      <p>${t('theme.kbd.story.subtitle')}</p>
    </header>

    <section class="kbd-story__section" aria-labelledby="kbd-section-single">
      <h2 id="kbd-section-single" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.kbd.story.section.single')}</h2>
      <div class="kbd-story__row">
        ${renderKbd({ keys: 'Esc' })}
        ${renderKbd({ keys: 'Tab' })}
        ${renderKbd({ keys: 'Enter' })}
        ${renderKbd({ keys: '?' })}
      </div>
    </section>

    <section class="kbd-story__section" aria-labelledby="kbd-section-chord">
      <h2 id="kbd-section-chord" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.kbd.story.section.chord')}</h2>
      <div class="kbd-story__row">
        ${renderKbd({ keys: ['Cmd', 'K'] })}
        ${renderKbd({ keys: ['Ctrl', 'Shift', 'P'] })}
        ${renderKbd({ keys: ['⌘', '⇧', 'F'] })}
      </div>
    </section>

    <section class="kbd-story__section" aria-labelledby="kbd-section-sequence">
      <h2 id="kbd-section-sequence" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.kbd.story.section.sequence')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.kbd.story.sequence-explainer')}</p>
      <div class="kbd-story__row">
        ${renderKbd({ keys: ['g', 'i'], separator: ' ' })}
        ${renderKbd({ keys: ['y', 'y'], separator: ' ' })}
      </div>
    </section>

    <section class="kbd-story__section" aria-labelledby="kbd-section-size">
      <h2 id="kbd-section-size" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.kbd.story.section.sizes')}</h2>
      <div class="kbd-story__row">
        <div class="kbd-story__cell">
          ${renderKbd({ keys: ['Cmd', 'K'], size: 'sm' })}
          <code class="kbd-story__cellname">sm</code>
        </div>
        <div class="kbd-story__cell">
          ${renderKbd({ keys: ['Cmd', 'K'], size: 'md' })}
          <code class="kbd-story__cellname">md</code>
        </div>
      </div>
    </section>

    <section class="kbd-story__section" aria-labelledby="kbd-section-inline">
      <h2 id="kbd-section-inline" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.kbd.story.section.inline')}</h2>
      <p class="theme-typography" data-variant="body">
        <span>${t('theme.kbd.story.inline-before')}</span>
        ${renderKbd({ keys: ['Cmd', 'K'] })}
        <span>${t('theme.kbd.story.inline-after')}</span>
      </p>
    </section>

    <section class="kbd-story__section" aria-labelledby="kbd-section-help">
      <h2 id="kbd-section-help" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.kbd.story.section.help')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.kbd.story.help-explainer')}</p>
      <dl class="kbd-story__deflist">
        <dt class="theme-typography" data-variant="body">${t('theme.kbd.story.shortcut.search')}</dt>
        <dd>${renderKbd({ keys: ['Cmd', 'K'] })}</dd>
        <dt class="theme-typography" data-variant="body">${t('theme.kbd.story.shortcut.save')}</dt>
        <dd>${renderKbd({ keys: ['Cmd', 'S'] })}</dd>
        <dt class="theme-typography" data-variant="body">${t('theme.kbd.story.shortcut.toggle-shortcuts')}</dt>
        <dd>${renderKbd({ keys: 'Shift' })} ${renderKbd({ keys: '?' })}</dd>
      </dl>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Kbd" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="kbd-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="kbd-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.kbd-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.kbd-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.kbd-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.kbd-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.kbd-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: center; }
.kbd-story__cell { display: grid; gap: var(--spacing-1); justify-items: center; }
.kbd-story__cellname { font: var(--typography-code); color: var(--color-text-tertiary); }
.kbd-story__deflist { display: grid; grid-template-columns: 1fr auto; gap: var(--spacing-2) var(--spacing-4); margin: 0; align-items: baseline; }
.kbd-story__deflist > dd { margin: 0; }
.kbd-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
