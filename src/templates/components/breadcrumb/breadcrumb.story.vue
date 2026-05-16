<!--
  Breadcrumb story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · 2-levels · 4-levels · with-icon · current-page-only
                · long-trail.

  Doctrine:
    - Pure presentation. Zero controller. Native <a> handles activation.
    - <nav aria-label> is the landmark; <ol> stamps positional semantics.
    - Last item is non-link with aria-current="page".
    - Chevron-right separator (in bidi whitelist) auto-flips in RTL.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

import chevronRightSvg from '../../../assets/icons/chevron-right.svg?raw';
import userSvg         from '../../../assets/icons/user.svg?raw';
import settingsSvg     from '../../../assets/icons/settings.svg?raw';

const ICONS = {
  'chevron-right': chevronRightSvg,
  user: userSvg,
  settings: settingsSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

function icon(name, sizeAttr = 'sm', extraClass = '') {
  return `<span class="cremona-icon cremona-icon-bidi ${extraClass}" data-icon="${name}" data-size="${sizeAttr}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderBreadcrumb({ items, ariaLabel, separator = 'chevron-right' }) {
  if (!items || items.length === 0) return '';
  const listInner = items.map((item, i) => {
    const isLast = i === items.length - 1;
    const iconHtml = item.icon
      ? `<span class="cremona-icon cremona-breadcrumb__icon" data-icon="${item.icon}" data-size="sm" aria-hidden="true" role="presentation">${ICONS[item.icon] || ''}</span>`
      : '';
    if (isLast) {
      return `
        <li class="cremona-breadcrumb__item">
          <span class="cremona-breadcrumb__current" aria-current="page">
            ${iconHtml}<span>${item.label}</span>
          </span>
        </li>
      `;
    }
    const sepIcon = `<span class="cremona-icon cremona-icon-bidi cremona-breadcrumb__separator" data-icon="${separator}" data-size="sm" aria-hidden="true" role="presentation">${ICONS[separator] || ''}</span>`;
    return `
      <li class="cremona-breadcrumb__item">
        <a class="cremona-breadcrumb__link" href="${item.href}">
          ${iconHtml}<span>${item.label}</span>
        </a>
        ${sepIcon}
      </li>
    `;
  }).join('');
  return `
    <nav class="cremona-breadcrumb" aria-label="${ariaLabel}">
      <ol class="cremona-breadcrumb__list">${listInner}</ol>
    </nav>
  `;
}

function block(html, label) {
  return `
    <div class="breadcrumb-story__block">
      ${label ? `<code class="breadcrumb-story__blocklabel">${label}</code>` : ''}
      <div class="breadcrumb-story__blockcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  ariaNav:      t('theme.breadcrumb.aria.nav'),
  labelHome:    t('theme.breadcrumb.story.sample.home'),
  labelProjects: t('theme.breadcrumb.story.sample.projects'),
  labelArcelor:  t('theme.breadcrumb.story.sample.arcelor'),
  labelTasks:    t('theme.breadcrumb.story.sample.tasks'),
  labelMigration:t('theme.breadcrumb.story.sample.migration'),
  labelTeam:     t('theme.breadcrumb.story.sample.team'),
  labelMember:   t('theme.breadcrumb.story.sample.member'),
  labelSettings: t('theme.breadcrumb.story.sample.settings'),
  labelDangerZone: t('theme.breadcrumb.story.sample.danger-zone'),
  labelLongProject: t('theme.breadcrumb.story.sample.long-project'),
  labelLongPage:    t('theme.breadcrumb.story.sample.long-page'),
};

const bodyHtml = `
  <section class="breadcrumb-story" data-testid="breadcrumb-root">
    <header class="breadcrumb-story__header">
      <h1>${t('theme.breadcrumb.story.title')}</h1>
      <p>${t('theme.breadcrumb.story.subtitle')}</p>
    </header>

    <section class="breadcrumb-story__section" aria-labelledby="bc-section-default">
      <h2 id="bc-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.breadcrumb.story.section.default')}</h2>
      <p class="breadcrumb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.breadcrumb.story.explainer.default')}</p>
      <div class="breadcrumb-story__stack">
        ${block(renderBreadcrumb({
          ariaLabel: SAMPLES.ariaNav,
          items: [
            { label: SAMPLES.labelHome, href: '/' },
            { label: SAMPLES.labelProjects, href: '/projects' },
            { label: SAMPLES.labelArcelor },
          ],
        }), '3 niveaux · Home → Projects → Arcelor (current)')}
      </div>
    </section>

    <section class="breadcrumb-story__section" aria-labelledby="bc-section-2-levels">
      <h2 id="bc-section-2-levels" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.breadcrumb.story.section.two-levels')}</h2>
      <div class="breadcrumb-story__stack">
        ${block(renderBreadcrumb({
          ariaLabel: SAMPLES.ariaNav,
          items: [
            { label: SAMPLES.labelTeam, href: '/team' },
            { label: SAMPLES.labelMember },
          ],
        }), '2 niveaux · Team → Member (current)')}
      </div>
    </section>

    <section class="breadcrumb-story__section" aria-labelledby="bc-section-4-levels">
      <h2 id="bc-section-4-levels" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.breadcrumb.story.section.four-levels')}</h2>
      <p class="breadcrumb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.breadcrumb.story.explainer.four-levels')}</p>
      <div class="breadcrumb-story__stack">
        ${block(renderBreadcrumb({
          ariaLabel: SAMPLES.ariaNav,
          items: [
            { label: SAMPLES.labelHome, href: '/' },
            { label: SAMPLES.labelProjects, href: '/projects' },
            { label: SAMPLES.labelArcelor, href: '/projects/arcelor' },
            { label: SAMPLES.labelTasks, href: '/projects/arcelor/tasks' },
            { label: SAMPLES.labelMigration },
          ],
        }), '5 niveaux profonds — Ring 2 ajoutera l\'overflow ellipsis')}
      </div>
    </section>

    <section class="breadcrumb-story__section" aria-labelledby="bc-section-icon">
      <h2 id="bc-section-icon" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.breadcrumb.story.section.with-icon')}</h2>
      <p class="breadcrumb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.breadcrumb.story.explainer.with-icon')}</p>
      <div class="breadcrumb-story__stack">
        ${block(renderBreadcrumb({
          ariaLabel: SAMPLES.ariaNav,
          items: [
            { label: SAMPLES.labelHome, href: '/', icon: 'user' },
            { label: SAMPLES.labelSettings, href: '/settings', icon: 'settings' },
            { label: SAMPLES.labelDangerZone },
          ],
        }), 'avec icônes en leading position')}
      </div>
    </section>

    <section class="breadcrumb-story__section" aria-labelledby="bc-section-current-only">
      <h2 id="bc-section-current-only" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.breadcrumb.story.section.current-only')}</h2>
      <p class="breadcrumb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.breadcrumb.story.explainer.current-only')}</p>
      <div class="breadcrumb-story__stack">
        ${block(renderBreadcrumb({
          ariaLabel: SAMPLES.ariaNav,
          items: [
            { label: SAMPLES.labelHome },
          ],
        }), 'un seul item · pas de séparateur · current-page')}
      </div>
    </section>

    <section class="breadcrumb-story__section" aria-labelledby="bc-section-long">
      <h2 id="bc-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.breadcrumb.story.section.long-trail')}</h2>
      <div class="breadcrumb-story__stack">
        ${block(renderBreadcrumb({
          ariaLabel: SAMPLES.ariaNav,
          items: [
            { label: SAMPLES.labelHome, href: '/' },
            { label: SAMPLES.labelLongProject, href: '/projects/long' },
            { label: SAMPLES.labelLongPage },
          ],
        }), 'libellés longs +30 % FR · wrap naturel')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Breadcrumb" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="breadcrumb-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="breadcrumb-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.breadcrumb-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.breadcrumb-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.breadcrumb-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.breadcrumb-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.breadcrumb-story__stack { display: grid; gap: var(--spacing-3); }
.breadcrumb-story__block { display: grid; gap: var(--spacing-2); }
.breadcrumb-story__blocklabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.breadcrumb-story__blockcontent { padding: var(--spacing-3); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); }
.breadcrumb-story__explainer { max-inline-size: 70ch; }
.breadcrumb-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
