<!--
  ButtonGroup story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default (segmented confirm) · variants combos · sizes
                · vertical · detached (gap-spaced) · icon-only toolbar.

  Zero Stimulus controller. The CSS handles border-collapsing via
  :first-child / :not(:first-child):not(:last-child) / :last-child
  logical-property rules. Each inner Button keeps its own focus + click
  semantics (NOT a roving-tabindex pattern — see ToggleGroup for that).

  Visual baselines capture the segmented at-rest look (collapsed adjacent
  borders). The :hover z-index lift is interactive — excluded from snapshot.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

import chevronLeftSvg  from '../../../assets/icons/chevron-left.svg?raw';
import chevronRightSvg from '../../../assets/icons/chevron-right.svg?raw';
import chevronDownSvg  from '../../../assets/icons/chevron-down.svg?raw';
import editSvg         from '../../../assets/icons/edit-3.svg?raw';
import trashSvg        from '../../../assets/icons/trash-2.svg?raw';
import copySvg         from '../../../assets/icons/copy.svg?raw';
import moreHorizontalSvg from '../../../assets/icons/more-horizontal.svg?raw';
import plusSvg         from '../../../assets/icons/plus.svg?raw';

const ICONS = {
  'chevron-left': chevronLeftSvg,
  'chevron-right': chevronRightSvg,
  'chevron-down': chevronDownSvg,
  'edit-3': editSvg,
  'trash-2': trashSvg,
  copy: copySvg,
  'more-horizontal': moreHorizontalSvg,
  plus: plusSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

function icon(name, size, modifier) {
  const sz = size === 'sm' ? 'sm' : 'md';
  return `<span class="theme-icon theme-button__icon theme-button__icon--${modifier}" data-icon="${name}" data-size="${sz}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderButton(props = {}) {
  const { label, variant = 'primary', size = 'md', iconLeading, iconTrailing, ariaLabel, disabled } = props;
  const leadingHtml = iconLeading ? icon(iconLeading, size, 'leading') : '';
  const trailingHtml = iconTrailing ? icon(iconTrailing, size, 'trailing') : '';
  const labelHtml = label ? `<span class="theme-button__label">${label}</span>` : '';
  const attrs = [
    `type="button"`,
    `class="theme-button"`,
    `data-variant="${variant}"`,
    `data-size="${size}"`,
    disabled ? 'disabled' : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
  ].filter(Boolean).join(' ');
  return `<button ${attrs}>${leadingHtml}${labelHtml}${trailingHtml}</button>`;
}

function group({ label, orientation = 'horizontal', detached = false }, buttonsHtml) {
  const classes = ['theme-button-group'];
  if (detached) classes.push('theme-button-group--detached');
  return `<div class="${classes.join(' ')}" role="group" data-orientation="${orientation}" aria-label="${label}">${buttonsHtml}</div>`;
}

function row(html, label) {
  return `
    <div class="bgroup-story__row">
      ${label ? `<code class="bgroup-story__rowlabel">${label}</code>` : ''}
      <div class="bgroup-story__rowcontent">${html}</div>
    </div>
  `;
}

const ACTIONS = {
  save: t('theme.common.actions.save'),
  cancel: t('theme.common.actions.cancel'),
  delete: t('theme.common.actions.delete'),
  confirm: t('theme.common.actions.confirm'),
};
const SAMPLES = {
  prevAria: t('theme.button-group.aria.prev'),
  nextAria: t('theme.button-group.aria.next'),
  editAria: t('theme.button-group.aria.edit'),
  copyAria: t('theme.button-group.aria.copy'),
  deleteAria: t('theme.button-group.aria.delete'),
  moreAria: t('theme.button-group.aria.more'),
  groupConfirm: t('theme.button-group.label.confirm-dialog'),
  groupPaging: t('theme.button-group.label.pagination'),
  groupRow: t('theme.button-group.label.row-actions'),
  groupSidebar: t('theme.button-group.label.sidebar-actions'),
  groupDialog: t('theme.button-group.label.dialog-footer'),
  groupSize: t('theme.button-group.label.size-demo'),
};

const bodyHtml = `
  <section class="bgroup-story" data-testid="button-group-root">
    <header class="bgroup-story__header">
      <h1>${t('theme.button-group.story.title')}</h1>
      <p>${t('theme.button-group.story.subtitle')}</p>
    </header>

    <section class="bgroup-story__section" aria-labelledby="bg-section-default">
      <h2 id="bg-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button-group.story.section.default')}</h2>
      <p class="bgroup-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.button-group.story.explainer.default')}</p>
      <div class="bgroup-story__stack">
        ${row(
          group({ label: SAMPLES.groupConfirm },
            renderButton({ label: ACTIONS.cancel, variant: 'secondary' }) +
            renderButton({ label: ACTIONS.confirm, variant: 'primary' }),
          ),
          'segmented confirm (secondary + primary)'
        )}
      </div>
    </section>

    <section class="bgroup-story__section" aria-labelledby="bg-section-variants">
      <h2 id="bg-section-variants" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button-group.story.section.variants')}</h2>
      <div class="bgroup-story__stack">
        ${row(
          group({ label: SAMPLES.groupPaging },
            renderButton({ variant: 'secondary', iconLeading: 'chevron-left',  ariaLabel: SAMPLES.prevAria }) +
            renderButton({ variant: 'secondary', iconLeading: 'chevron-right', ariaLabel: SAMPLES.nextAria }),
          ),
          'pagination (icon-only secondary)'
        )}
        ${row(
          group({ label: SAMPLES.groupRow },
            renderButton({ variant: 'ghost', iconLeading: 'edit-3', ariaLabel: SAMPLES.editAria }) +
            renderButton({ variant: 'ghost', iconLeading: 'copy',   ariaLabel: SAMPLES.copyAria }) +
            renderButton({ variant: 'ghost', iconLeading: 'trash-2', ariaLabel: SAMPLES.deleteAria }) +
            renderButton({ variant: 'ghost', iconLeading: 'more-horizontal', ariaLabel: SAMPLES.moreAria }),
          ),
          'row actions (ghost icon-only)'
        )}
      </div>
    </section>

    <section class="bgroup-story__section" aria-labelledby="bg-section-sizes">
      <h2 id="bg-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button-group.story.section.sizes')}</h2>
      <div class="bgroup-story__stack">
        ${row(
          group({ label: SAMPLES.groupSize },
            renderButton({ label: ACTIONS.save, variant: 'secondary', size: 'sm' }) +
            renderButton({ label: ACTIONS.cancel, variant: 'secondary', size: 'sm' }),
          ),
          'sm'
        )}
        ${row(
          group({ label: SAMPLES.groupSize },
            renderButton({ label: ACTIONS.save, variant: 'secondary', size: 'md' }) +
            renderButton({ label: ACTIONS.cancel, variant: 'secondary', size: 'md' }),
          ),
          'md'
        )}
        ${row(
          group({ label: SAMPLES.groupSize },
            renderButton({ label: ACTIONS.save, variant: 'secondary', size: 'lg' }) +
            renderButton({ label: ACTIONS.cancel, variant: 'secondary', size: 'lg' }),
          ),
          'lg'
        )}
      </div>
    </section>

    <section class="bgroup-story__section" aria-labelledby="bg-section-vertical">
      <h2 id="bg-section-vertical" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button-group.story.section.vertical')}</h2>
      <p class="bgroup-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.button-group.story.explainer.vertical')}</p>
      <div class="bgroup-story__stack">
        ${row(
          group({ label: SAMPLES.groupSidebar, orientation: 'vertical' },
            renderButton({ label: ACTIONS.save, variant: 'secondary', iconLeading: 'edit-3' }) +
            renderButton({ label: ACTIONS.delete, variant: 'secondary', iconLeading: 'trash-2' }) +
            renderButton({ label: ACTIONS.cancel, variant: 'secondary', iconLeading: 'copy' }),
          ),
          'vertical (sidebar actions)'
        )}
      </div>
    </section>

    <section class="bgroup-story__section" aria-labelledby="bg-section-detached">
      <h2 id="bg-section-detached" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button-group.story.section.detached')}</h2>
      <p class="bgroup-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.button-group.story.explainer.detached')}</p>
      <div class="bgroup-story__stack">
        ${row(
          group({ label: SAMPLES.groupDialog, detached: true },
            renderButton({ label: ACTIONS.cancel, variant: 'ghost' }) +
            renderButton({ label: ACTIONS.confirm, variant: 'primary' }),
          ),
          'dialog footer (detached, ghost + primary)'
        )}
        ${row(
          group({ label: SAMPLES.groupDialog, detached: true },
            renderButton({ label: ACTIONS.cancel, variant: 'secondary' }) +
            renderButton({ label: ACTIONS.delete, variant: 'destructive', iconLeading: 'trash-2' }),
          ),
          'destructive footer (detached, secondary + destructive)'
        )}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/ButtonGroup" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="bgroup-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="bgroup-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.bgroup-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.bgroup-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.bgroup-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.bgroup-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.bgroup-story__stack { display: grid; gap: var(--spacing-4); }
.bgroup-story__row { display: grid; grid-template-columns: minmax(220px, 280px) 1fr; gap: var(--spacing-3); align-items: center; }
.bgroup-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.bgroup-story__rowcontent { min-inline-size: 0; }
.bgroup-story__explainer { max-inline-size: 70ch; }
.bgroup-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
