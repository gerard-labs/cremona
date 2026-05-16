<!--
  DropdownMenu story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · with leading icons · with kbd shortcuts ·
                with groups + separators · with disabled items · 4 placements.

  Stimulus controllers `popover` + `dropdown-menu` co-mounted on the wrap
  (`data-controller="popover dropdown-menu"`). Popover handles open/close
  + Floating UI positioning + Esc/click-outside dismiss; DropdownMenu
  handles role="menu" + role="menuitem" + roving tabindex + Arrow nav +
  Enter/Space activate + close-on-item-click.

  Items rendered manually (template literals) matching Item.html.twig's
  output structure — see item.html.twig for the canonical Twig source.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import bellSvg from '../../../assets/icons/bell.svg?raw';
import chevronDownSvg from '../../../assets/icons/chevron-down.svg?raw';
import copySvg from '../../../assets/icons/copy.svg?raw';
import deleteSvg from '../../../assets/icons/delete.svg?raw';
import editSvg from '../../../assets/icons/edit-3.svg?raw';
import eyeSvg from '../../../assets/icons/eye.svg?raw';
import heartSvg from '../../../assets/icons/heart.svg?raw';
import infoSvg from '../../../assets/icons/info.svg?raw';
import menuSvg from '../../../assets/icons/menu.svg?raw';
import moreSvg from '../../../assets/icons/more-horizontal.svg?raw';
import searchSvg from '../../../assets/icons/search.svg?raw';
import settingsSvg from '../../../assets/icons/settings.svg?raw';
import trashSvg from '../../../assets/icons/trash-2.svg?raw';
import userSvg from '../../../assets/icons/user.svg?raw';

const ICONS = {
  bell: bellSvg, 'chevron-down': chevronDownSvg, copy: copySvg, delete: deleteSvg,
  'edit-3': editSvg, eye: eyeSvg, heart: heartSvg, info: infoSvg, menu: menuSvg,
  'more-horizontal': moreSvg, search: searchSvg, settings: settingsSvg,
  'trash-2': trashSvg, user: userSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

let _ddCounter = 0;
function nextId() { return `dd-${++_ddCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function kbd(keys, separator = '+') {
  const parts = keys.map((k, i) => {
    const sep = i < keys.length - 1 ? `<span class="cremona-kbd-sep" aria-hidden="true">${separator}</span>` : '';
    return `<kbd class="cremona-kbd" data-size="sm">${k}</kbd>${sep}`;
  }).join('');
  return `<kbd class="cremona-kbd-group" data-size="sm">${parts}</kbd>`;
}

function renderItem({ label, iconLeading, iconTrailing, kbdShortcut, disabled = false }) {
  const leadingHtml = iconLeading
    ? `<span class="cremona-item__icon cremona-item__icon--leading">${icon(iconLeading)}</span>` : '';
  const trailingHtml = kbdShortcut
    ? `<span class="cremona-item__trailing">${kbd(kbdShortcut)}</span>`
    : iconTrailing
      ? `<span class="cremona-item__icon cremona-item__icon--trailing">${icon(iconTrailing)}</span>`
      : '';
  const attrs = disabled ? ' aria-disabled="true" data-state="disabled"' : '';
  return `<div class="cremona-item"${attrs}>
    ${leadingHtml}
    <div class="cremona-item__text">
      <span class="cremona-item__label">${label}</span>
    </div>
    ${trailingHtml}
  </div>`;
}

function triggerButton(label, opts = {}) {
  const { variant = 'ghost', size = 'md', iconLeading = null } = opts;
  const leadingHtml = iconLeading
    ? `<span class="cremona-button__icon cremona-button__icon--leading">${icon(iconLeading)}</span>` : '';
  return (id) => `<button type="button" class="cremona-button" data-variant="${variant}" data-size="${size}"
    data-popover-target="trigger"
    aria-haspopup="menu" aria-expanded="false" aria-controls="${id}">
    ${leadingHtml}<span class="cremona-button__label">${label}</span>
    <span class="cremona-button__icon cremona-button__icon--trailing">${icon('chevron-down', 'sm')}</span>
  </button>`;
}

function renderMenu({ placement = 'bottom', triggerHtml, itemsHtml }) {
  const id = nextId();
  return `
    <div class="cremona-popover cremona-dropdown-menu"
      data-controller="popover dropdown-menu"
      data-action="click->popover#toggle keydown.esc@window->popover#close keydown->dropdown-menu#keydown click->dropdown-menu#onItemClick"
      data-popover-placement-value="${placement}"
      data-popover-offset-value="8"
      data-popover-open-value="false">
      ${triggerHtml(id)}
      <div id="${id}" class="cremona-popover__content cremona-dropdown-menu__content"
        data-popover-target="content"
        data-state="closed"
        data-placement="${placement}"
        role="menu"
        hidden>
        ${itemsHtml}
      </div>
    </div>
  `;
}

const S = {
  actionsTrig: t('theme.dropdown-menu.story.sample.actions-trigger'),
  actionRename: t('theme.dropdown-menu.story.sample.action-rename'),
  actionDup: t('theme.dropdown-menu.story.sample.action-duplicate'),
  actionArch: t('theme.dropdown-menu.story.sample.action-archive'),
  actionDel: t('theme.dropdown-menu.story.sample.action-delete'),
  iconsTrig: t('theme.dropdown-menu.story.sample.icons-trigger'),
  iconsProf: t('theme.dropdown-menu.story.sample.icons-profile'),
  iconsSet: t('theme.dropdown-menu.story.sample.icons-settings'),
  iconsNotif: t('theme.dropdown-menu.story.sample.icons-notifications'),
  iconsSign: t('theme.dropdown-menu.story.sample.icons-signout'),
  kbdTrig: t('theme.dropdown-menu.story.sample.kbd-trigger'),
  kbdCopy: t('theme.dropdown-menu.story.sample.kbd-copy'),
  kbdPaste: t('theme.dropdown-menu.story.sample.kbd-paste'),
  kbdCut: t('theme.dropdown-menu.story.sample.kbd-cut'),
  kbdSearch: t('theme.dropdown-menu.story.sample.kbd-search'),
  groupsTrig: t('theme.dropdown-menu.story.sample.groups-trigger'),
  groupsLabelView: t('theme.dropdown-menu.story.sample.groups-label-view'),
  groupsLight: t('theme.dropdown-menu.story.sample.groups-light'),
  groupsDark: t('theme.dropdown-menu.story.sample.groups-dark'),
  groupsSystem: t('theme.dropdown-menu.story.sample.groups-system'),
  groupsLabelDensity: t('theme.dropdown-menu.story.sample.groups-label-density'),
  groupsComf: t('theme.dropdown-menu.story.sample.groups-comfortable'),
  groupsCozy: t('theme.dropdown-menu.story.sample.groups-cozy'),
  groupsComp: t('theme.dropdown-menu.story.sample.groups-compact'),
  disTrig: t('theme.dropdown-menu.story.sample.disabled-trigger'),
  disView: t('theme.dropdown-menu.story.sample.disabled-view'),
  disMsg: t('theme.dropdown-menu.story.sample.disabled-message'),
  disRm: t('theme.dropdown-menu.story.sample.disabled-remove'),
  plTop: t('theme.dropdown-menu.story.sample.placement-trigger-top'),
  plBot: t('theme.dropdown-menu.story.sample.placement-trigger-bottom'),
  plSta: t('theme.dropdown-menu.story.sample.placement-trigger-start'),
  plEnd: t('theme.dropdown-menu.story.sample.placement-trigger-end'),
  plItem1: t('theme.dropdown-menu.story.sample.placement-item-1'),
  plItem2: t('theme.dropdown-menu.story.sample.placement-item-2'),
  plItem3: t('theme.dropdown-menu.story.sample.placement-item-3'),
};

const bodyHtml = `
  <section class="dropdown-menu-story" data-testid="dropdown-menu-root">
    <header class="dropdown-menu-story__header">
      <h1>${t('theme.dropdown-menu.story.title')}</h1>
      <p>${t('theme.dropdown-menu.story.subtitle')}</p>
    </header>

    <section class="dropdown-menu-story__section" aria-labelledby="dd-section-default">
      <h2 id="dd-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.dropdown-menu.story.section.default')}</h2>
      <p class="dropdown-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.dropdown-menu.story.explainer.default')}</p>
      <div class="dropdown-menu-story__row">
        ${renderMenu({
          triggerHtml: triggerButton(S.actionsTrig, { iconLeading: 'more-horizontal' }),
          itemsHtml: [
            renderItem({ label: S.actionRename }),
            renderItem({ label: S.actionDup }),
            renderItem({ label: S.actionArch }),
            renderItem({ label: S.actionDel }),
          ].join(''),
        })}
      </div>
    </section>

    <section class="dropdown-menu-story__section" aria-labelledby="dd-section-icons">
      <h2 id="dd-section-icons" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.dropdown-menu.story.section.with-icons')}</h2>
      <p class="dropdown-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.dropdown-menu.story.explainer.with-icons')}</p>
      <div class="dropdown-menu-story__row">
        ${renderMenu({
          triggerHtml: triggerButton(S.iconsTrig, { iconLeading: 'user' }),
          itemsHtml: [
            renderItem({ label: S.iconsProf, iconLeading: 'user' }),
            renderItem({ label: S.iconsSet, iconLeading: 'settings' }),
            renderItem({ label: S.iconsNotif, iconLeading: 'bell' }),
            '<hr class="cremona-dropdown-menu__separator">',
            renderItem({ label: S.iconsSign, iconLeading: 'delete' }),
          ].join(''),
        })}
      </div>
    </section>

    <section class="dropdown-menu-story__section" aria-labelledby="dd-section-kbd">
      <h2 id="dd-section-kbd" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.dropdown-menu.story.section.with-kbd')}</h2>
      <p class="dropdown-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.dropdown-menu.story.explainer.with-kbd')}</p>
      <div class="dropdown-menu-story__row">
        ${renderMenu({
          triggerHtml: triggerButton(S.kbdTrig, { iconLeading: 'edit-3' }),
          itemsHtml: [
            renderItem({ label: S.kbdCopy, iconLeading: 'copy', kbdShortcut: ['⌘', 'C'] }),
            renderItem({ label: S.kbdPaste, iconLeading: 'copy', kbdShortcut: ['⌘', 'V'] }),
            renderItem({ label: S.kbdCut, iconLeading: 'copy', kbdShortcut: ['⌘', 'X'] }),
            '<hr class="cremona-dropdown-menu__separator">',
            renderItem({ label: S.kbdSearch, iconLeading: 'search', kbdShortcut: ['⌘', 'K'] }),
          ].join(''),
        })}
      </div>
    </section>

    <section class="dropdown-menu-story__section" aria-labelledby="dd-section-groups">
      <h2 id="dd-section-groups" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.dropdown-menu.story.section.groups')}</h2>
      <p class="dropdown-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.dropdown-menu.story.explainer.groups')}</p>
      <div class="dropdown-menu-story__row">
        ${renderMenu({
          triggerHtml: triggerButton(S.groupsTrig, { iconLeading: 'settings' }),
          itemsHtml: [
            `<div class="cremona-dropdown-menu__group-label" role="presentation">${S.groupsLabelView}</div>`,
            renderItem({ label: S.groupsLight, iconLeading: 'eye' }),
            renderItem({ label: S.groupsDark, iconLeading: 'eye' }),
            renderItem({ label: S.groupsSystem, iconLeading: 'eye' }),
            '<hr class="cremona-dropdown-menu__separator">',
            `<div class="cremona-dropdown-menu__group-label" role="presentation">${S.groupsLabelDensity}</div>`,
            renderItem({ label: S.groupsComf, iconLeading: 'menu' }),
            renderItem({ label: S.groupsCozy, iconLeading: 'menu' }),
            renderItem({ label: S.groupsComp, iconLeading: 'menu' }),
          ].join(''),
        })}
      </div>
    </section>

    <section class="dropdown-menu-story__section" aria-labelledby="dd-section-disabled">
      <h2 id="dd-section-disabled" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.dropdown-menu.story.section.disabled')}</h2>
      <p class="dropdown-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.dropdown-menu.story.explainer.disabled')}</p>
      <div class="dropdown-menu-story__row">
        ${renderMenu({
          triggerHtml: triggerButton(S.disTrig, { iconLeading: 'user' }),
          itemsHtml: [
            renderItem({ label: S.disView, iconLeading: 'user' }),
            renderItem({ label: S.disMsg, iconLeading: 'bell' }),
            renderItem({ label: S.disRm, iconLeading: 'trash-2', disabled: true }),
          ].join(''),
        })}
      </div>
    </section>

    <section class="dropdown-menu-story__section" aria-labelledby="dd-section-placements">
      <h2 id="dd-section-placements" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.dropdown-menu.story.section.placements')}</h2>
      <p class="dropdown-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.dropdown-menu.story.explainer.placements')}</p>
      <div class="dropdown-menu-story__placements-grid">
        ${renderMenu({
          placement: 'top',
          triggerHtml: triggerButton(S.plTop),
          itemsHtml: [
            renderItem({ label: S.plItem1, iconLeading: 'info' }),
            renderItem({ label: S.plItem2, iconLeading: 'info' }),
            renderItem({ label: S.plItem3, iconLeading: 'info' }),
          ].join(''),
        })}
        ${renderMenu({
          placement: 'bottom',
          triggerHtml: triggerButton(S.plBot),
          itemsHtml: [
            renderItem({ label: S.plItem1, iconLeading: 'info' }),
            renderItem({ label: S.plItem2, iconLeading: 'info' }),
            renderItem({ label: S.plItem3, iconLeading: 'info' }),
          ].join(''),
        })}
        ${renderMenu({
          placement: 'start',
          triggerHtml: triggerButton(S.plSta),
          itemsHtml: [
            renderItem({ label: S.plItem1, iconLeading: 'info' }),
            renderItem({ label: S.plItem2, iconLeading: 'info' }),
            renderItem({ label: S.plItem3, iconLeading: 'info' }),
          ].join(''),
        })}
        ${renderMenu({
          placement: 'end',
          triggerHtml: triggerButton(S.plEnd),
          itemsHtml: [
            renderItem({ label: S.plItem1, iconLeading: 'info' }),
            renderItem({ label: S.plItem2, iconLeading: 'info' }),
            renderItem({ label: S.plItem3, iconLeading: 'info' }),
          ].join(''),
        })}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Dropdown Menu" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="dropdown-menu-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="dropdown-menu-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.dropdown-menu-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.dropdown-menu-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.dropdown-menu-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.dropdown-menu-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.dropdown-menu-story__row { display: flex; gap: var(--spacing-3); padding-block: var(--spacing-3); align-items: flex-start; }
.dropdown-menu-story__placements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--spacing-12); padding-block: var(--spacing-12); padding-inline: var(--spacing-8); justify-items: center; align-items: center; min-block-size: 220px; }
.dropdown-menu-story__explainer { max-inline-size: 70ch; }
.dropdown-menu-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
