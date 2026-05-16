<!--
  KeyboardShortcutsOverlay story — 4 viewport variants.
  Sections : full-overlay-open (with Navigation + Edition + Search sections).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderKbdChord(keys, separator = '+') {
  const cells = keys.map((k) => `<kbd class="theme-kbd" data-size="sm">${k}</kbd>`).join(`<span class="theme-kbd-sep" aria-hidden="true">${separator}</span>`);
  return `<kbd class="theme-kbd-group" data-size="sm">${cells}</kbd>`;
}

function renderRow(shortcut) {
  return `
    <div class="theme-keyboard-shortcuts-overlay__row">
      <dt class="theme-keyboard-shortcuts-overlay__description">
        <span class="theme-typography" data-variant="body">${shortcut.description}</span>
      </dt>
      <dd class="theme-keyboard-shortcuts-overlay__chord">
        ${renderKbdChord(shortcut.keys, shortcut.separator || '+')}
      </dd>
    </div>`;
}

function renderSection(section, index) {
  const rows = section.shortcuts.map(renderRow).join('');
  return `
    <section class="theme-keyboard-shortcuts-overlay__section"
             aria-labelledby="story-kbd-section-${index}-title">
      <h3 id="story-kbd-section-${index}-title"
          class="theme-typography theme-keyboard-shortcuts-overlay__section-title"
          data-variant="overline" data-color="tertiary">${section.title}</h3>
      <dl class="theme-keyboard-shortcuts-overlay__list">${rows}</dl>
    </section>`;
}

function renderOverlay({ id }) {
  const sections = [
    {
      title: t('theme.keyboard-shortcuts-overlay.section.navigation'),
      shortcuts: [
        { keys: ['⌘', 'K'], description: t('theme.keyboard-shortcuts-overlay.shortcut.command-palette') },
        { keys: ['G', 'I'], separator: ' ', description: t('theme.keyboard-shortcuts-overlay.shortcut.go-inbox') },
        { keys: ['G', 'P'], separator: ' ', description: t('theme.keyboard-shortcuts-overlay.shortcut.go-projects') },
        { keys: ['Esc'],    description: t('theme.keyboard-shortcuts-overlay.shortcut.close-overlay') },
      ],
    },
    {
      title: t('theme.keyboard-shortcuts-overlay.section.edition'),
      shortcuts: [
        { keys: ['⌘', 'S'], description: t('theme.keyboard-shortcuts-overlay.shortcut.save') },
        { keys: ['⌘', 'Z'], description: t('theme.keyboard-shortcuts-overlay.shortcut.undo') },
        { keys: ['⌘', '⇧', 'Z'], description: t('theme.keyboard-shortcuts-overlay.shortcut.redo') },
      ],
    },
    {
      title: t('theme.keyboard-shortcuts-overlay.section.search'),
      shortcuts: [
        { keys: ['/'],      description: t('theme.keyboard-shortcuts-overlay.shortcut.search-focus') },
        { keys: ['?'],      description: t('theme.keyboard-shortcuts-overlay.shortcut.show-shortcuts') },
      ],
    },
  ];
  const sectionsHtml = sections.map((s, i) => renderSection(s, i)).join('');
  // For visual baseline, render the Dialog "open" inline (position relative instead of fixed top-layer).
  return `
    <div class="theme-dialog-wrap" data-dialog-open-value="true">
      <dialog class="theme-dialog theme-keyboard-shortcuts-overlay"
              data-size="lg"
              open
              aria-labelledby="${id}-title"
              style="position: static; display: block; inline-size: auto; max-inline-size: 720px;">
        <header class="theme-dialog__header">
          <h2 id="${id}-title" class="theme-dialog__title">${t('theme.keyboard-shortcuts-overlay.title')}</h2>
          <button class="theme-button theme-dialog__close"
                  data-variant="ghost" data-size="sm"
                  aria-label="${t('theme.dialog.aria.close')}">
            <svg class="theme-icon" data-size="sm" aria-hidden="true"><use href="#icon-x"/></svg>
          </button>
        </header>
        <div class="theme-dialog__body">
          <div class="theme-keyboard-shortcuts-overlay__sections">${sectionsHtml}</div>
        </div>
        <footer class="theme-dialog__footer">
          <p class="theme-keyboard-shortcuts-overlay__footer-hint theme-typography" data-variant="caption" data-color="tertiary">${t('theme.keyboard-shortcuts-overlay.footer.dismiss-hint')}</p>
        </footer>
      </dialog>
    </div>`;
}

const bodyHtml = `
  <section class="kbd-overlay-story" aria-labelledby="kbd-overlay-story-title">
    <header class="kbd-overlay-story__header">
      <h1 id="kbd-overlay-story-title">${t('theme.keyboard-shortcuts-overlay.story.title')}</h1>
      <p>${t('theme.keyboard-shortcuts-overlay.story.subtitle')}</p>
    </header>

    <section class="kbd-overlay-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.keyboard-shortcuts-overlay.story.section.full')}</h2>
      <p class="kbd-overlay-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.keyboard-shortcuts-overlay.story.explainer.full')}</p>
      <div class="kbd-overlay-story__frame">${renderOverlay({ id: 'story-overlay-full' })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/KeyboardShortcutsOverlay" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="kbd-overlay-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="kbd-overlay-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.kbd-overlay-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.kbd-overlay-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.kbd-overlay-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.kbd-overlay-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.kbd-overlay-story__explainer { max-inline-size: 70ch; }
.kbd-overlay-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.kbd-overlay-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
