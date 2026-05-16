<!--
  ContextMenu story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Default (area=self) — right-click anywhere on the surface.
    2. With icons + kbd shortcuts — typical desktop-app context menu.
    3. With groups + separators + disabled items — Notion-style.
    4. area=parent — right-click on the parent zone (table-row idiom).
    5. Events log — capture context-menu:open / :close with x/y coords.

  Stimulus controllers `popover` + `dropdown-menu` + `context-menu`
  co-mounted on each ContextMenu wrap. The native browser context menu is
  suppressed inside the configured area — accept the trade-off (loss of
  back/forward/inspect inside the area), document it in the spec.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import bellSvg from '../../../assets/icons/bell.svg?raw';
import copySvg from '../../../assets/icons/copy.svg?raw';
import deleteSvg from '../../../assets/icons/delete.svg?raw';
import editSvg from '../../../assets/icons/edit-3.svg?raw';
import eyeSvg from '../../../assets/icons/eye.svg?raw';
import infoSvg from '../../../assets/icons/info.svg?raw';
import searchSvg from '../../../assets/icons/search.svg?raw';
import settingsSvg from '../../../assets/icons/settings.svg?raw';
import starSvg from '../../../assets/icons/star.svg?raw';
import trashSvg from '../../../assets/icons/trash-2.svg?raw';
import userSvg from '../../../assets/icons/user.svg?raw';

const ICONS = {
  bell: bellSvg, copy: copySvg, delete: deleteSvg,
  'edit-3': editSvg, eye: eyeSvg, info: infoSvg,
  search: searchSvg, settings: settingsSvg, star: starSvg,
  'trash-2': trashSvg, user: userSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  // Wire the events-log section: listen at document level for
  // context-menu:open / :close and append entries to the visible log.
  const log = document.getElementById('cm-events-log');
  if (!log) return;
  document.addEventListener('context-menu:open', (e) => {
    const li = document.createElement('li');
    li.textContent = `▶ context-menu:open at (${e.detail.x}, ${e.detail.y})`;
    log.appendChild(li);
  });
  document.addEventListener('context-menu:close', () => {
    const li = document.createElement('li');
    li.textContent = `◀ context-menu:close`;
    log.appendChild(li);
  });
});

let _cmCounter = 0;
function nextId() { return `cm-${++_cmCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function kbd(keys) {
  const parts = keys.map((k, i) => {
    const sep = i < keys.length - 1 ? `<span class="cremona-kbd-sep" aria-hidden="true">+</span>` : '';
    return `<kbd class="cremona-kbd" data-size="sm">${k}</kbd>${sep}`;
  }).join('');
  return `<kbd class="cremona-kbd-group" data-size="sm">${parts}</kbd>`;
}

function renderItem({ label, iconLeading, kbdShortcut, disabled = false }) {
  const leadingHtml = iconLeading
    ? `<span class="cremona-item__icon cremona-item__icon--leading">${icon(iconLeading)}</span>` : '';
  const trailingHtml = kbdShortcut
    ? `<span class="cremona-item__trailing">${kbd(kbdShortcut)}</span>` : '';
  const attrs = disabled ? ' aria-disabled="true" data-state="disabled"' : '';
  return `<div class="cremona-item"${attrs}>
    ${leadingHtml}
    <div class="cremona-item__text"><span class="cremona-item__label">${label}</span></div>
    ${trailingHtml}
  </div>`;
}

function hint(text) {
  return `<div class="context-menu-story__hint">${text}</div>`;
}

function groupLabel(text) {
  return `<div class="cremona-dropdown-menu__group-label" role="presentation">${text}</div>`;
}

const SEPARATOR = '<hr class="cremona-dropdown-menu__separator">';

function renderContextMenu({ area = 'self', itemsHtml, areaContent, ariaLabel }) {
  const id = nextId();
  return `
    <div class="context-menu-story__area" aria-label="${ariaLabel}">
      ${areaContent}
      <div class="cremona-popover cremona-dropdown-menu cremona-context-menu"
        data-controller="popover dropdown-menu context-menu"
        data-action="contextmenu->context-menu#openAt keydown.esc@window->popover#close keydown->dropdown-menu#keydown click->dropdown-menu#onItemClick"
        data-popover-placement-value="bottom-start"
        data-popover-offset-value="0"
        data-popover-open-value="false"
        data-context-menu-area-value="${area}">
        <span class="cremona-context-menu__phantom"
          data-popover-target="trigger"
          data-context-menu-target="phantom"
          aria-hidden="true"></span>
        <div id="${id}"
          class="cremona-popover__content cremona-dropdown-menu__content cremona-context-menu__content"
          data-popover-target="content"
          data-state="closed"
          data-placement="bottom-start"
          role="menu"
          hidden>${itemsHtml}</div>
      </div>
    </div>
  `;
}

const S = {
  defaultArea: t('theme.context-menu.story.sample.default-area'),
  defaultItem1: t('theme.context-menu.story.sample.default-item-1'),
  defaultItem2: t('theme.context-menu.story.sample.default-item-2'),
  defaultItem3: t('theme.context-menu.story.sample.default-item-3'),
  defaultItem4: t('theme.context-menu.story.sample.default-item-4'),
  iconsArea: t('theme.context-menu.story.sample.icons-area'),
  iconsCut: t('theme.context-menu.story.sample.icons-cut'),
  iconsCopy: t('theme.context-menu.story.sample.icons-copy'),
  iconsPaste: t('theme.context-menu.story.sample.icons-paste'),
  iconsFind: t('theme.context-menu.story.sample.icons-find'),
  groupsArea: t('theme.context-menu.story.sample.groups-area'),
  groupsLabelEdit: t('theme.context-menu.story.sample.groups-label-edit'),
  groupsRename: t('theme.context-menu.story.sample.groups-rename'),
  groupsDuplicate: t('theme.context-menu.story.sample.groups-duplicate'),
  groupsLabelOrg: t('theme.context-menu.story.sample.groups-label-org'),
  groupsFavorite: t('theme.context-menu.story.sample.groups-favorite'),
  groupsArchive: t('theme.context-menu.story.sample.groups-archive'),
  groupsDelete: t('theme.context-menu.story.sample.groups-delete'),
  groupsView: t('theme.context-menu.story.sample.groups-view-disabled'),
  parentArea: t('theme.context-menu.story.sample.parent-area'),
  parentRow1: t('theme.context-menu.story.sample.parent-row-1'),
  parentRow2: t('theme.context-menu.story.sample.parent-row-2'),
  parentItem1: t('theme.context-menu.story.sample.parent-item-1'),
  parentItem2: t('theme.context-menu.story.sample.parent-item-2'),
  parentItem3: t('theme.context-menu.story.sample.parent-item-3'),
  eventsArea: t('theme.context-menu.story.sample.events-area'),
  eventsItem1: t('theme.context-menu.story.sample.events-item-1'),
  eventsItem2: t('theme.context-menu.story.sample.events-item-2'),
  eventsLogTitle: t('theme.context-menu.story.sample.events-log-title'),
};

const bodyHtml = `
  <section class="context-menu-story" data-testid="context-menu-root">
    <header class="context-menu-story__header">
      <h1>${t('theme.context-menu.story.title')}</h1>
      <p>${t('theme.context-menu.story.subtitle')}</p>
    </header>

    <section class="context-menu-story__section" aria-labelledby="cm-section-default">
      <h2 id="cm-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.context-menu.story.section.default')}</h2>
      <p class="context-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.context-menu.story.explainer.default')}</p>
      ${renderContextMenu({
        area: 'self',
        ariaLabel: S.defaultArea,
        areaContent: hint(S.defaultArea),
        itemsHtml: [
          renderItem({ label: S.defaultItem1 }),
          renderItem({ label: S.defaultItem2 }),
          renderItem({ label: S.defaultItem3 }),
          renderItem({ label: S.defaultItem4 }),
        ].join(''),
      })}
    </section>

    <section class="context-menu-story__section" aria-labelledby="cm-section-icons">
      <h2 id="cm-section-icons" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.context-menu.story.section.icons')}</h2>
      <p class="context-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.context-menu.story.explainer.icons')}</p>
      ${renderContextMenu({
        area: 'self',
        ariaLabel: S.iconsArea,
        areaContent: hint(S.iconsArea),
        itemsHtml: [
          renderItem({ label: S.iconsCut, iconLeading: 'edit-3', kbdShortcut: ['⌘', 'X'] }),
          renderItem({ label: S.iconsCopy, iconLeading: 'copy', kbdShortcut: ['⌘', 'C'] }),
          renderItem({ label: S.iconsPaste, iconLeading: 'copy', kbdShortcut: ['⌘', 'V'] }),
          SEPARATOR,
          renderItem({ label: S.iconsFind, iconLeading: 'search', kbdShortcut: ['⌘', 'F'] }),
        ].join(''),
      })}
    </section>

    <section class="context-menu-story__section" aria-labelledby="cm-section-groups">
      <h2 id="cm-section-groups" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.context-menu.story.section.groups')}</h2>
      <p class="context-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.context-menu.story.explainer.groups')}</p>
      ${renderContextMenu({
        area: 'self',
        ariaLabel: S.groupsArea,
        areaContent: hint(S.groupsArea),
        itemsHtml: [
          groupLabel(S.groupsLabelEdit),
          renderItem({ label: S.groupsRename, iconLeading: 'edit-3' }),
          renderItem({ label: S.groupsDuplicate, iconLeading: 'copy' }),
          SEPARATOR,
          groupLabel(S.groupsLabelOrg),
          renderItem({ label: S.groupsFavorite, iconLeading: 'star' }),
          renderItem({ label: S.groupsArchive, iconLeading: 'eye' }),
          renderItem({ label: S.groupsView, iconLeading: 'info', disabled: true }),
          SEPARATOR,
          renderItem({ label: S.groupsDelete, iconLeading: 'trash-2' }),
        ].join(''),
      })}
    </section>

    <section class="context-menu-story__section" aria-labelledby="cm-section-parent">
      <h2 id="cm-section-parent" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.context-menu.story.section.parent')}</h2>
      <p class="context-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.context-menu.story.explainer.parent')}</p>
      <div class="context-menu-story__table" aria-label="${S.parentArea}">
        <div class="context-menu-story__table-row">
          <span class="context-menu-story__table-cell">${S.parentRow1}</span>
          ${renderContextMenu({
            area: 'parent',
            ariaLabel: S.parentArea,
            areaContent: '',
            itemsHtml: [
              renderItem({ label: S.parentItem1, iconLeading: 'eye' }),
              renderItem({ label: S.parentItem2, iconLeading: 'edit-3' }),
              renderItem({ label: S.parentItem3, iconLeading: 'trash-2' }),
            ].join(''),
          })}
        </div>
        <div class="context-menu-story__table-row">
          <span class="context-menu-story__table-cell">${S.parentRow2}</span>
          ${renderContextMenu({
            area: 'parent',
            ariaLabel: S.parentArea,
            areaContent: '',
            itemsHtml: [
              renderItem({ label: S.parentItem1, iconLeading: 'eye' }),
              renderItem({ label: S.parentItem2, iconLeading: 'edit-3' }),
              renderItem({ label: S.parentItem3, iconLeading: 'trash-2' }),
            ].join(''),
          })}
        </div>
      </div>
    </section>

    <section class="context-menu-story__section" aria-labelledby="cm-section-events">
      <h2 id="cm-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.context-menu.story.section.events')}</h2>
      <p class="context-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.context-menu.story.explainer.events')}</p>
      ${renderContextMenu({
        area: 'self',
        ariaLabel: S.eventsArea,
        areaContent: hint(S.eventsArea),
        itemsHtml: [
          renderItem({ label: S.eventsItem1, iconLeading: 'info' }),
          renderItem({ label: S.eventsItem2, iconLeading: 'bell' }),
        ].join(''),
      })}
      <div class="context-menu-story__events">
        <h3 class="cremona-typography" data-variant="caption" data-color="secondary">${S.eventsLogTitle}</h3>
        <ul id="cm-events-log" class="context-menu-story__events-log"></ul>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/ContextMenu" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="context-menu-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="context-menu-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.context-menu-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.context-menu-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.context-menu-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.context-menu-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.context-menu-story__explainer { max-inline-size: 70ch; }
.context-menu-story__area { display: flex; align-items: center; justify-content: center; min-block-size: 160px; padding: var(--spacing-6); border: 2px dashed var(--color-border-default); border-radius: var(--radius-md); background: var(--color-bg-sunken); cursor: context-menu; }
.context-menu-story__hint { font: var(--typography-caption); color: var(--color-text-tertiary); user-select: none; pointer-events: none; }
.context-menu-story__table { display: flex; flex-direction: column; gap: var(--spacing-2); border-radius: var(--radius-md); overflow: hidden; }
.context-menu-story__table-row { display: flex; align-items: center; padding: var(--spacing-4); background: var(--color-bg-sunken); border-radius: var(--radius-sm); cursor: context-menu; }
.context-menu-story__table-cell { font: var(--typography-body); flex: 1 1 auto; }
.context-menu-story__events { margin-block-start: var(--spacing-3); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); }
.context-menu-story__events h3 { margin-block-end: var(--spacing-2); }
.context-menu-story__events-log { margin: 0; padding: 0; list-style: none; font: var(--typography-code); font-size: var(--font-size-xs); color: var(--color-text-secondary); max-block-size: 120px; overflow: auto; }
.context-menu-story__events-log li { padding-block: 2px; }
.context-menu-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
