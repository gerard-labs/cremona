<!--
  Search-CommandPalette story — 4 viewport variants.
  Sections : default-palette · launcher-button · register-API-demo.
-->
<script setup>
import { onMounted } from 'vue';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot();
  // Register sample search commands after controllers connect.
  Promise.resolve().then(() => {
    if (!window.themeCommand) return;
    window.themeCommand.register([
      { id: 'search.docs',      label: t('theme.search-command-palette.story.cmd.docs'),      group: t('theme.search-command-palette.story.group.docs'),     kbdHint: 'G D' },
      { id: 'search.projects',  label: t('theme.search-command-palette.story.cmd.projects'),  group: t('theme.search-command-palette.story.group.search'),   kbdHint: 'G P' },
      { id: 'search.tasks',     label: t('theme.search-command-palette.story.cmd.tasks'),     group: t('theme.search-command-palette.story.group.search'),   kbdHint: 'G T' },
      { id: 'create.project',   label: t('theme.search-command-palette.story.cmd.new-project'), group: t('theme.search-command-palette.story.group.actions'), kbdHint: 'N P' },
      { id: 'create.task',      label: t('theme.search-command-palette.story.cmd.new-task'),    group: t('theme.search-command-palette.story.group.actions'), kbdHint: 'N T' },
      { id: 'help.shortcuts',   label: t('theme.search-command-palette.story.cmd.shortcuts'),   group: t('theme.search-command-palette.story.group.help'),    kbdHint: '?' },
    ]);
  });
  // Event log.
  document.addEventListener('command:open', () => addLog('open'));
  document.addEventListener('command:close', () => addLog('close'));
  document.addEventListener('command:execute', (e) => addLog(`execute → ${e.detail.id} (${e.detail.label})`));
});

function addLog(line) {
  const log = document.querySelector('#search-command-events-log');
  if (!log) return;
  const div = document.createElement('div');
  div.textContent = line;
  log.prepend(div);
}

function renderCommandPalette({ id, commands }) {
  // Pre-rendered listbox SSR seed — the Combobox controller picks up
  // options on connect.
  const grouped = {};
  commands.forEach((c) => {
    if (!grouped[c.group]) grouped[c.group] = [];
    grouped[c.group].push(c);
  });
  const groupHtml = Object.keys(grouped).map((group) => `
    <li role="presentation" class="cremona-command__group-header" aria-hidden="true">${group}</li>
    ${grouped[group].map((c, i) => `
      <li id="${id}-opt-${c.id}" role="option" class="cremona-command__option"
          data-combobox-target="option" data-value="${c.id}" aria-selected="false">
        <span class="cremona-item__label">${c.label}</span>
        ${c.kbdHint ? `<kbd class="cremona-command__option-kbd cremona-kbd">${c.kbdHint}</kbd>` : ''}
      </li>
    `).join('')}
  `).join('');
  return `
    <div class="cremona-search-command-palette">
      <div class="cremona-command"
           data-controller="dialog combobox command"
           data-command-hotkey-value="k">
        <dialog class="cremona-command__dialog cremona-dialog"
                data-dialog-target="dialog"
                aria-labelledby="${id}-title">
          <h2 id="${id}-title" class="cremona-command__sr-only">${t('theme.search-command-palette.label')}</h2>
          <div class="cremona-command__input-wrap">
            <svg class="cremona-command__search-icon cremona-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-search"/></svg>
            <input type="text"
                   class="cremona-command__input cremona-input"
                   data-combobox-target="input"
                   data-action="input->combobox#filter keydown->combobox#keydown"
                   role="combobox"
                   aria-autocomplete="list" aria-expanded="true"
                   aria-haspopup="listbox" aria-controls="${id}-listbox"
                   placeholder="${t('theme.search-command-palette.placeholder')}" />
            <kbd class="cremona-command__esc-hint cremona-kbd" aria-hidden="true">Esc</kbd>
          </div>
          <ul id="${id}-listbox" class="cremona-command__listbox" role="listbox"
              data-combobox-target="optionsContainer">
            ${groupHtml}
          </ul>
          <div class="cremona-command__empty" data-combobox-target="empty" hidden role="status" aria-live="polite">
            <strong class="cremona-command__empty-title">${t('theme.command.empty.title')}</strong>
            <span class="cremona-command__empty-query">${t('theme.command.empty.query-prefix')} « <strong data-combobox-target="emptyQuery"></strong> »</span>
            <span class="cremona-command__empty-body">${t('theme.command.empty.body')}</span>
          </div>
          <footer class="cremona-command__footer">
            <span class="cremona-command__footer-hint"><kbd class="cremona-kbd">↑</kbd><kbd class="cremona-kbd">↓</kbd><span>${t('theme.command.footer.navigate')}</span></span>
            <span class="cremona-command__footer-hint"><kbd class="cremona-kbd">⏎</kbd><span>${t('theme.command.footer.execute')}</span></span>
            <span class="cremona-command__footer-hint"><kbd class="cremona-kbd">Esc</kbd><span>${t('theme.command.footer.dismiss')}</span></span>
          </footer>
        </dialog>
      </div>
    </div>
  `;
}

const sampleCommands = [
  { id: 'go.home',     label: t('theme.search-command-palette.story.cmd.home'),       group: t('theme.search-command-palette.story.group.navigation'), kbdHint: 'G H' },
  { id: 'search.docs', label: t('theme.search-command-palette.story.cmd.docs'),       group: t('theme.search-command-palette.story.group.docs'),       kbdHint: 'G D' },
  { id: 'create.proj', label: t('theme.search-command-palette.story.cmd.new-project'), group: t('theme.search-command-palette.story.group.actions'),    kbdHint: 'N P' },
];

const bodyHtml = `
  <section class="search-command-palette-story" aria-labelledby="search-command-palette-story-title">
    <header class="search-command-palette-story__header">
      <h1 id="search-command-palette-story-title">${t('theme.search-command-palette.story.title')}</h1>
      <p>${t('theme.search-command-palette.story.subtitle')}</p>
    </header>

    <section class="search-command-palette-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-command-palette.story.section.launcher')}</h2>
      <p class="search-command-palette-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-command-palette.story.explainer.launcher')}</p>
      <div class="search-command-palette-story__frame">
        <button type="button"
                class="cremona-button cremona-search-command-palette__launcher"
                data-variant="ghost"
                onclick="window.themeCommand && window.themeCommand.open()"
                aria-label="${t('theme.search-command-palette.label')}">
          <svg class="cremona-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-search"/></svg>
          <span>${t('theme.search-command-palette.placeholder')}</span>
          <kbd class="cremona-kbd cremona-search-command-palette__launcher-kbd">${t('theme.search-command-palette.launcher.kbd-hint')}</kbd>
        </button>
      </div>
    </section>

    <section class="search-command-palette-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-command-palette.story.section.palette')}</h2>
      <p class="search-command-palette-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-command-palette.story.explainer.palette')}</p>
      <div class="search-command-palette-story__frame">${renderCommandPalette({ id: 'story-search-cmd', commands: sampleCommands })}</div>
      <p class="search-command-palette-story__hint cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-command-palette.story.hint.programmatic')}</p>
    </section>

    <section class="search-command-palette-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-command-palette.story.section.events-log')}</h2>
      <p class="search-command-palette-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-command-palette.story.explainer.events-log')}</p>
      <div id="search-command-events-log" class="search-command-palette-story__events-log" aria-live="polite"></div>
    </section>

  </section>
`;
</script>

<template>
  <Story title="Patterns/Search-CommandPalette" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="search-command-palette-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="search-command-palette-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.search-command-palette-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.search-command-palette-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.search-command-palette-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.search-command-palette-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.search-command-palette-story__explainer { max-inline-size: 70ch; }
.search-command-palette-story__hint { font-style: italic; max-inline-size: 70ch; }
.search-command-palette-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); min-block-size: 80px; display: flex; align-items: center; justify-content: center; }
.search-command-palette-story__events-log { display: flex; flex-direction: column-reverse; gap: var(--spacing-1); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-secondary); max-block-size: 200px; overflow: auto; }
.search-command-palette-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
