<!--
  Item story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · with-slots · selected/states · element-variants
                (div/a/button) · with-kbd · with-description (list view).

  Zero Stimulus controller at Item level. The orchestrating parent (a
  future DropdownMenu / NavMenu / ContextMenu in Ring 2) drives keyboard
  navigation and selection logic. This story exercises the visual + the
  3 element forms (div / a / button).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

import userSvg          from '../../../assets/icons/user.svg?raw';
import settingsSvg      from '../../../assets/icons/settings.svg?raw';
import searchSvg        from '../../../assets/icons/search.svg?raw';
import bellSvg          from '../../../assets/icons/bell.svg?raw';
import trashSvg         from '../../../assets/icons/trash-2.svg?raw';
import chevronRightSvg  from '../../../assets/icons/chevron-right.svg?raw';
import checkSvg         from '../../../assets/icons/check.svg?raw';
import starSvg          from '../../../assets/icons/star.svg?raw';

const ICONS = {
  user: userSvg, settings: settingsSvg, search: searchSvg, bell: bellSvg,
  'trash-2': trashSvg, 'chevron-right': chevronRightSvg, check: checkSvg, star: starSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

function icon(name, modifier) {
  return `<span class="cremona-icon cremona-item__icon cremona-item__icon--${modifier}" data-icon="${name}" data-size="sm" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function kbd(keys, separator = '+') {
  const items = keys.map((k, i) => {
    const sep = i < keys.length - 1 ? `<span class="cremona-kbd-sep" aria-hidden="true">${separator}</span>` : '';
    return `<kbd class="cremona-kbd" data-size="sm">${k}</kbd>${sep}`;
  }).join('');
  return `<kbd class="cremona-kbd-group" data-size="sm">${items}</kbd>`;
}

function renderItem(props = {}) {
  const {
    label, description, iconLeading, iconTrailing, kbdShortcut,
    selected, disabled, as = 'div', href, type = 'button',
    ariaLabel, ariaCurrent, className = '',
  } = props;

  const classes = ['cremona-item'];
  if (className) classes.push(className);

  const leadingHtml = iconLeading ? icon(iconLeading, 'leading') : '';
  const textHtml = (label || description) ? `
    <div class="cremona-item__text">
      ${label ? `<span class="cremona-item__label">${label}</span>` : ''}
      ${description ? `<span class="cremona-item__description">${description}</span>` : ''}
    </div>` : '';
  const trailingHtml = kbdShortcut
    ? `<span class="cremona-item__trailing">${kbd(kbdShortcut)}</span>`
    : (iconTrailing ? icon(iconTrailing, 'trailing') : '');

  const attrs = [
    `class="${classes.join(' ')}"`,
    selected ? `data-selected="true"` : '',
    disabled ? `data-state="disabled"` : '',
    as === 'a' && href ? `href="${href}"` : '',
    as === 'button' ? `type="${type}"` : '',
    as === 'button' && disabled ? `disabled` : '',
    as !== 'button' && disabled ? `aria-disabled="true"` : '',
    ariaCurrent ? `aria-current="${ariaCurrent}"` : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
  ].filter(Boolean).join(' ');

  return `<${as} ${attrs}>${leadingHtml}${textHtml}${trailingHtml}</${as}>`;
}

function block(html, label) {
  return `
    <div class="item-story__block">
      ${label ? `<code class="item-story__blocklabel">${label}</code>` : ''}
      <div class="item-story__blockcontent">${html}</div>
    </div>
  `;
}

function list(itemsHtml, ariaLabel) {
  return `<div class="item-story__list" role="group" aria-label="${ariaLabel}">${itemsHtml}</div>`;
}

const SAMPLES = {
  profile: t('theme.item.story.sample.profile'),
  settings: t('theme.item.story.sample.settings'),
  notifications: t('theme.item.story.sample.notifications'),
  search: t('theme.item.story.sample.search'),
  delete: t('theme.item.story.sample.delete'),
  newProject: t('theme.item.story.sample.new-project'),
  starred: t('theme.item.story.sample.starred'),
  descTeam: t('theme.item.story.sample.desc-team'),
  descSearch: t('theme.item.story.sample.desc-search'),
  descShortcut: t('theme.item.story.sample.desc-shortcut'),
  listMenuLabel: t('theme.item.story.label.dropdown-menu'),
  listNavLabel: t('theme.item.story.label.nav-menu'),
  listResultsLabel: t('theme.item.story.label.search-results'),
};

const bodyHtml = `
  <section class="item-story" data-testid="item-root">
    <header class="item-story__header">
      <h1>${t('theme.item.story.title')}</h1>
      <p>${t('theme.item.story.subtitle')}</p>
    </header>

    <section class="item-story__section" aria-labelledby="item-section-default">
      <h2 id="item-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.item.story.section.default')}</h2>
      <div class="item-story__stack">
        ${block(list(
          renderItem({ label: SAMPLES.profile }) +
          renderItem({ label: SAMPLES.settings }) +
          renderItem({ label: SAMPLES.notifications }),
        SAMPLES.listMenuLabel), 'label-only (dropdown menu)')}
      </div>
    </section>

    <section class="item-story__section" aria-labelledby="item-section-slots">
      <h2 id="item-section-slots" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.item.story.section.slots')}</h2>
      <div class="item-story__stack">
        ${block(list(
          renderItem({ label: SAMPLES.profile,       iconLeading: 'user' }) +
          renderItem({ label: SAMPLES.settings,      iconLeading: 'settings' }) +
          renderItem({ label: SAMPLES.notifications, iconLeading: 'bell', iconTrailing: 'chevron-right' }) +
          renderItem({ label: SAMPLES.delete,        iconLeading: 'trash-2' }),
        SAMPLES.listMenuLabel), 'with leading + trailing icons')}
      </div>
    </section>

    <section class="item-story__section" aria-labelledby="item-section-states">
      <h2 id="item-section-states" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.item.story.section.states')}</h2>
      <p class="item-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.item.story.explainer.states')}</p>
      <div class="item-story__stack">
        ${block(list(
          renderItem({ label: SAMPLES.profile,       iconLeading: 'user' }) +
          renderItem({ label: SAMPLES.settings,      iconLeading: 'settings', selected: true, iconTrailing: 'check' }) +
          renderItem({ label: SAMPLES.notifications, iconLeading: 'bell', disabled: true }),
        SAMPLES.listMenuLabel), 'default + selected + disabled')}
      </div>
    </section>

    <section class="item-story__section" aria-labelledby="item-section-elements">
      <h2 id="item-section-elements" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.item.story.section.elements')}</h2>
      <p class="item-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.item.story.explainer.elements')}</p>
      <div class="item-story__stack">
        ${block(list(
          renderItem({ label: SAMPLES.profile, iconLeading: 'user', as: 'div' }) +
          renderItem({ label: SAMPLES.settings, iconLeading: 'settings', as: 'a', href: '#settings', iconTrailing: 'chevron-right' }) +
          renderItem({ label: SAMPLES.delete, iconLeading: 'trash-2', as: 'button' }),
        SAMPLES.listMenuLabel), 'div · a · button (mixed)')}
      </div>
    </section>

    <section class="item-story__section" aria-labelledby="item-section-kbd">
      <h2 id="item-section-kbd" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.item.story.section.kbd')}</h2>
      <p class="item-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.item.story.explainer.kbd')}</p>
      <div class="item-story__stack">
        ${block(list(
          renderItem({ label: SAMPLES.newProject, iconLeading: 'search', kbdShortcut: ['Cmd', 'N'] }) +
          renderItem({ label: SAMPLES.search,     iconLeading: 'search', kbdShortcut: ['Cmd', 'K'] }) +
          renderItem({ label: SAMPLES.starred,    iconLeading: 'star',   kbdShortcut: ['Cmd', 'S'] }),
        SAMPLES.listMenuLabel), 'with kbd shortcut (command palette pattern)')}
      </div>
    </section>

    <section class="item-story__section" aria-labelledby="item-section-description">
      <h2 id="item-section-description" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.item.story.section.description')}</h2>
      <p class="item-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.item.story.explainer.description')}</p>
      <div class="item-story__stack">
        ${block(list(
          renderItem({ label: SAMPLES.profile,  description: SAMPLES.descTeam,     iconLeading: 'user',     as: 'a', href: '#profile' }) +
          renderItem({ label: SAMPLES.search,   description: SAMPLES.descSearch,   iconLeading: 'search',   as: 'a', href: '#search', selected: true }) +
          renderItem({ label: SAMPLES.starred,  description: SAMPLES.descShortcut, iconLeading: 'star',     as: 'a', href: '#starred' }),
        SAMPLES.listResultsLabel), 'with description (search results / list view)')}
      </div>
    </section>

    <section class="item-story__section" aria-labelledby="item-section-aria-current">
      <h2 id="item-section-aria-current" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.item.story.section.aria-current')}</h2>
      <p class="item-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.item.story.explainer.aria-current')}</p>
      <div class="item-story__stack">
        ${block(list(
          renderItem({ label: SAMPLES.profile,       iconLeading: 'user',     as: 'a', href: '#profile' }) +
          renderItem({ label: SAMPLES.settings,      iconLeading: 'settings', as: 'a', href: '#settings', ariaCurrent: 'page' }) +
          renderItem({ label: SAMPLES.notifications, iconLeading: 'bell',     as: 'a', href: '#notifications' }),
        SAMPLES.listNavLabel), 'nav menu with aria-current="page"')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Item" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="item-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="item-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.item-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.item-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.item-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.item-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.item-story__stack { display: grid; gap: var(--spacing-3); }
.item-story__block { display: grid; gap: var(--spacing-2); }
.item-story__blocklabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.item-story__blockcontent { min-inline-size: 0; }
.item-story__explainer { max-inline-size: 70ch; }
.item-story__list { display: flex; flex-direction: column; gap: 2px; padding: var(--spacing-2); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); min-inline-size: 280px; max-inline-size: 420px; }
.item-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
