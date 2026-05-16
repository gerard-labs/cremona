<!--
  Onboarding-Checklist story — 4 viewport variants.
  Sections : empty · partial-50 · all-completed.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderChecklist({ id, title, items }) {
  const total = items.length;
  const done = items.filter(it => it.completed).length;
  const pct = total > 0 ? Math.round((done * 100) / total) : 0;
  const allDone = done === total && total > 0;
  return `
    <article class="theme-card theme-onboarding-checklist ${allDone ? 'theme-onboarding-checklist--complete' : ''}" id="${id}" aria-labelledby="${id}-title">
      <header class="theme-card__header theme-onboarding-checklist__header">
        <h2 id="${id}-title" class="theme-typography theme-onboarding-checklist__title" data-variant="h2">${title}</h2>
        <p class="theme-onboarding-checklist__progress-text" aria-live="polite">
          ${allDone ? t('theme.onboarding.checklist.all-done') : t('theme.onboarding.checklist.progress').replace('{done}', done).replace('{total}', total)}
        </p>
        <progress class="theme-progress theme-onboarding-checklist__progress" value="${pct}" max="100" aria-label="${t('theme.onboarding.checklist.progress-aria')}">${pct}%</progress>
      </header>
      <ul class="theme-onboarding-checklist__items">
        ${items.map(item => `
          <li class="theme-onboarding-checklist__item"${item.completed ? ' data-completed="true"' : ''}>
            <label class="theme-onboarding-checklist__label">
              <input type="checkbox" class="theme-checkbox" ${item.completed ? 'checked' : ''} ${item.disabled ? 'disabled' : ''} aria-readonly="true" onclick="return false;">
              <span class="theme-onboarding-checklist__item-label">${item.label}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    </article>
  `;
}

const title = t('theme.onboarding.checklist.title');
const itemsEmpty = [
  { id: 'profile', label: t('theme.onboarding.checklist.item.profile'), completed: false },
  { id: 'invite',  label: t('theme.onboarding.checklist.item.invite'),  completed: false },
  { id: 'project', label: t('theme.onboarding.checklist.item.project'), completed: false },
  { id: 'integration', label: t('theme.onboarding.checklist.item.integration'), completed: false },
];
const itemsPartial = itemsEmpty.map((it, idx) => ({ ...it, completed: idx < 2 }));
const itemsAll = itemsEmpty.map(it => ({ ...it, completed: true }));

const bodyHtml = `
  <section class="onboarding-checklist-story" aria-labelledby="onboarding-checklist-story-title">
    <header class="onboarding-checklist-story__header">
      <h1 id="onboarding-checklist-story-title">${t('theme.onboarding.checklist.story.title')}</h1>
      <p>${t('theme.onboarding.checklist.story.subtitle')}</p>
    </header>

    <section class="onboarding-checklist-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.onboarding.checklist.story.section.empty')}</h2>
      <div class="onboarding-checklist-story__frame">${renderChecklist({ id: 'story-empty', title, items: itemsEmpty })}</div>
    </section>

    <section class="onboarding-checklist-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.onboarding.checklist.story.section.partial')}</h2>
      <div class="onboarding-checklist-story__frame">${renderChecklist({ id: 'story-partial', title, items: itemsPartial })}</div>
    </section>

    <section class="onboarding-checklist-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.onboarding.checklist.story.section.complete')}</h2>
      <div class="onboarding-checklist-story__frame">${renderChecklist({ id: 'story-complete', title, items: itemsAll })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Onboarding-Checklist" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="onboarding-checklist-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="onboarding-checklist-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.onboarding-checklist-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.onboarding-checklist-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.onboarding-checklist-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.onboarding-checklist-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.onboarding-checklist-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.onboarding-checklist-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
