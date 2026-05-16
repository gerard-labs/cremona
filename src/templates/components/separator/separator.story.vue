<!--
  Separator story — 4 viewport variants (Light/Dark × LTR/RTL).
  Demonstrates horizontal/vertical, solid/dashed/dotted, semantic vs
  decorative, and in-list usage.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderSeparator({ orientation = 'horizontal', variant = 'solid', decorative = true, className }) {
  const classes = ['cremona-separator'];
  if (variant !== 'solid') classes.push(`cremona-separator--${variant}`);
  if (className) classes.push(className);
  const ariaAttrs = decorative
    ? 'role="presentation" aria-hidden="true"'
    : `role="separator" aria-orientation="${orientation}"`;
  return `<div class="${classes.join(' ')}" data-orientation="${orientation}" ${ariaAttrs}></div>`;
}

const bodyHtml = `
  <section class="separator-story" data-testid="separator-root">
    <header class="separator-story__header">
      <h1>${t('theme.separator.story.title')}</h1>
      <p>${t('theme.separator.story.subtitle')}</p>
    </header>

    <section class="separator-story__section" aria-labelledby="separator-section-h">
      <h2 id="separator-section-h" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.separator.story.section.horizontal')}</h2>
      <div class="separator-story__stack">
        <div>
          <span class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.separator.story.label.solid')}</span>
          ${renderSeparator({ orientation: 'horizontal', variant: 'solid' })}
        </div>
        <div>
          <span class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.separator.story.label.dashed')}</span>
          ${renderSeparator({ orientation: 'horizontal', variant: 'dashed' })}
        </div>
        <div>
          <span class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.separator.story.label.dotted')}</span>
          ${renderSeparator({ orientation: 'horizontal', variant: 'dotted' })}
        </div>
      </div>
    </section>

    <section class="separator-story__section" aria-labelledby="separator-section-v">
      <h2 id="separator-section-v" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.separator.story.section.vertical')}</h2>
      <div class="separator-story__vstack">
        <div class="separator-story__vrow">
          <span class="cremona-typography" data-variant="body">${t('theme.separator.story.demo.start')}</span>
          ${renderSeparator({ orientation: 'vertical', variant: 'solid' })}
          <span class="cremona-typography" data-variant="body">${t('theme.separator.story.demo.middle')}</span>
          ${renderSeparator({ orientation: 'vertical', variant: 'dashed' })}
          <span class="cremona-typography" data-variant="body">${t('theme.separator.story.demo.end')}</span>
        </div>
      </div>
    </section>

    <section class="separator-story__section" aria-labelledby="separator-section-semantic">
      <h2 id="separator-section-semantic" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.separator.story.section.semantic')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.separator.story.semantic-explainer')}</p>
      <div class="separator-story__stack">
        ${renderSeparator({ orientation: 'horizontal', variant: 'solid', decorative: false })}
      </div>
    </section>

    <section class="separator-story__section" aria-labelledby="separator-section-list">
      <h2 id="separator-section-list" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.separator.story.section.in-list')}</h2>
      <ul class="separator-story__list">
        <li class="cremona-typography" data-variant="body">${t('theme.separator.story.list.first')}</li>
        ${renderSeparator({ orientation: 'horizontal', variant: 'solid', className: 'separator-story__listsep' })}
        <li class="cremona-typography" data-variant="body">${t('theme.separator.story.list.second')}</li>
        ${renderSeparator({ orientation: 'horizontal', variant: 'solid', className: 'separator-story__listsep' })}
        <li class="cremona-typography" data-variant="body">${t('theme.separator.story.list.third')}</li>
      </ul>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Separator" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="separator-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="separator-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.separator-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.separator-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.separator-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.separator-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.separator-story__stack { display: grid; gap: var(--spacing-3); }
.separator-story__vstack { display: flex; gap: var(--spacing-4); }
.separator-story__vrow { display: flex; align-items: stretch; gap: var(--spacing-3); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); }
.separator-story__list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--spacing-2); }
.separator-story__listsep { margin-block: var(--spacing-1); }
.separator-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
