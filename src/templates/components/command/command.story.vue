<!--
  Command palette story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5) :
    1. Default — ⌘K opens, grouped Navigation + Création + Aide.
    2. Empty state — type a no-match query.
    3. Kbd footer — explicit hint cluster.
    4. Programmatic open (window.themeCommand.open).
    5. Events log — command:open, command:execute, command:close.
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
  // Wait a tick for controllers to connect, then register sample commands.
  Promise.resolve().then(() => {
    if (!window.themeCommand) return;
    window.themeCommand.register([
      { id: 'go.home',     label: t('theme.command.story.cmd.go-home'),     group: t('theme.command.story.group.navigation'), kbdHint: 'G H' },
      { id: 'go.dashboard',label: t('theme.command.story.cmd.go-dashboard'),group: t('theme.command.story.group.navigation'), kbdHint: 'G D' },
      { id: 'go.settings', label: t('theme.command.story.cmd.go-settings'), group: t('theme.command.story.group.navigation'), kbdHint: 'G S' },
      { id: 'create.proj', label: t('theme.command.story.cmd.create-project'), group: t('theme.command.story.group.create'), kbdHint: 'N P' },
      { id: 'create.task', label: t('theme.command.story.cmd.create-task'),    group: t('theme.command.story.group.create'), kbdHint: 'N T' },
      { id: 'create.note', label: t('theme.command.story.cmd.create-note'),    group: t('theme.command.story.group.create'), kbdHint: 'N N' },
      { id: 'help.docs',   label: t('theme.command.story.cmd.help-docs'),      group: t('theme.command.story.group.help'),   kbdHint: '?' },
      { id: 'help.chat',   label: t('theme.command.story.cmd.help-chat'),      group: t('theme.command.story.group.help') },
    ]);
  });
  // Wire the events log demo on the events-demo wrap.
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const id = log.getAttribute('data-events-log');
    const wrap = document.getElementById(id);
    if (!wrap) continue;
    const out = log.querySelector('[data-events-out]');
    const append = (txt) => {
      const line = document.createElement('div');
      line.textContent = txt;
      if (out) out.appendChild(line);
    };
    wrap.addEventListener('command:open', () => append('command:open'));
    wrap.addEventListener('command:close', () => append('command:close'));
    wrap.addEventListener('command:execute', (e) => append('command:execute → ' + e.detail.id + ' (' + e.detail.group + ')'));
  }
  // Wire the programmatic-open button.
  const openBtn = document.getElementById('cmd-open-btn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (window.themeCommand) window.themeCommand.open();
    });
  }
});

function S(key) { return t('theme.command.story.' + key); }

function commandPalette({
  id = 'cmd-events-demo',
  label = '',
  placeholder = '',
  hotkey = 'k',
  kbdFooter = [],
}) {
  const footerHtml = kbdFooter.length > 0
    ? `<footer class="cremona-command__footer">${kbdFooter.map((h) =>
        `<span class="cremona-command__footer-hint">${h.keys.map((k) =>
          `<kbd class="cremona-kbd">${k}</kbd>`).join('')}<span class="cremona-command__footer-label">${h.label}</span></span>`,
      ).join('')}</footer>`
    : '';
  return `<div id="${id}" class="cremona-command"
    data-controller="dialog combobox command"
    data-command-hotkey-value="${hotkey}"
    data-command-placeholder-value="${placeholder}"
    data-combobox-placeholder-value="${placeholder}">
    <dialog class="cremona-command__dialog cremona-dialog"
      data-dialog-target="dialog"
      aria-labelledby="${id}-title">
      <h2 id="${id}-title" class="cremona-command__sr-only">${label}</h2>
      <div class="cremona-command__input-wrap">
        <span class="cremona-command__search-icon" aria-hidden="true"></span>
        <input type="text" class="cremona-command__input cremona-input"
          data-combobox-target="input"
          data-action="input->combobox#filter keydown->combobox#keydown"
          role="combobox" aria-autocomplete="list" aria-expanded="true"
          aria-haspopup="listbox" aria-controls="${id}-listbox"
          placeholder="${placeholder}" />
        <kbd class="cremona-command__esc-hint cremona-kbd" aria-hidden="true">Esc</kbd>
      </div>
      <ul id="${id}-listbox" class="cremona-command__listbox" role="listbox"
        data-combobox-target="optionsContainer"></ul>
      <div class="cremona-command__empty" data-combobox-target="empty" hidden
        role="status" aria-live="polite">
        <strong class="cremona-command__empty-title">${S('empty.title')}</strong>
        <span class="cremona-command__empty-query">${S('empty.query-prefix')} <strong data-combobox-target="emptyQuery"></strong></span>
        <span class="cremona-command__empty-body">${S('empty.body')}</span>
      </div>
      ${footerHtml}
    </dialog>
  </div>`;
}

const bodyHtml = `
  <section class="cmd-story" data-testid="command-root">
    <header class="cmd-story__header">
      <h1>${t('theme.command.story.title')}</h1>
      <p>${t('theme.command.story.subtitle')}</p>
      <div class="cmd-story__hint">
        ${S('hint.prefix')} <kbd class="cremona-kbd">⌘</kbd> + <kbd class="cremona-kbd">K</kbd> ${S('hint.suffix')}
        <button id="cmd-open-btn" type="button" class="cremona-button" data-variant="secondary">${S('hint.button-label')}</button>
      </div>
    </header>

    <section class="cmd-story__section" aria-labelledby="cmd-section-default">
      <h2 id="cmd-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="cmd-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      ${commandPalette({
        id: 'cmd-events-demo',
        label: S('label.default'),
        placeholder: S('placeholder.default'),
        kbdFooter: [
          { keys: ['↑', '↓'], label: S('footer.navigate') },
          { keys: ['⏎'], label: S('footer.execute') },
          { keys: ['Esc'], label: S('footer.dismiss') },
        ],
      })}
      <div class="cmd-story__log" data-events-log="cmd-events-demo">
        <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-events-out class="cmd-story__log-out"></div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Command" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="cmd-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="cmd-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.cmd-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.cmd-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.cmd-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.cmd-story__hint { display: flex; align-items: center; gap: var(--spacing-2); margin-block-start: var(--spacing-3); font: var(--typography-body); color: var(--color-text-secondary); flex-wrap: wrap; }
.cmd-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.cmd-story__explainer { max-inline-size: 70ch; }
.cmd-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.cmd-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.cmd-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
