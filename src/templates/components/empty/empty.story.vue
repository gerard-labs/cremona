<!--
  Empty story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · sizes · hero-illustration · composition-with-card
                · full-anatomy · long-content.

  Doctrine:
    - Pure visual composition. Zero Stimulus controller.
    - 3 sizes (sm in-card · md section-default · lg page-hero).
    - Lucide icons for sm/md; consumer-provided inline SVG for lg.
    - Title level overridable (h1 for page-level 404; h2 default).
    - Microcopy tone: invites, doesn't blame.
    - Composition with Card: Empty inside Card body block — natural.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

import searchSvg from '../../../assets/icons/search.svg?raw';
import userSvg   from '../../../assets/icons/user.svg?raw';
import bellSvg   from '../../../assets/icons/bell.svg?raw';
import starSvg   from '../../../assets/icons/star.svg?raw';

const ICONS = { search: searchSvg, user: userSvg, bell: bellSvg, star: starSvg };

setTranslations('fr', frDict);
setLocale('fr');

const ICON_SIZE_MAP = { sm: 'lg', md: 'xl', lg: 'xl' };

function icon(name, size) {
  return `<span class="cremona-icon cremona-empty__icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

let _emptyCounter = 0;
function nextId() { return `empty-${++_emptyCounter}`; }

function renderEmpty({
  title,
  size = 'md',
  iconName = null,
  illustrationHtml = null,
  body = null,
  bodyHtml = null,
  actionsHtml = null,
  footerHtml = null,
  titleLevel = 'h2',
}) {
  const id = nextId();
  const titleId = `${id}-title`;
  const allowedTitles = ['h1', 'h2', 'h3'];
  const titleTag = allowedTitles.includes(titleLevel) ? titleLevel : 'h2';
  const iconSize = ICON_SIZE_MAP[size] ?? 'xl';
  const illustration = illustrationHtml
    ? `<div class="cremona-empty__illustration" aria-hidden="true">${illustrationHtml}</div>`
    : iconName
      ? `<div class="cremona-empty__illustration" aria-hidden="true">${icon(iconName, iconSize)}</div>`
      : '';
  const bodyBlock = bodyHtml
    ? `<div class="cremona-empty__body">${bodyHtml}</div>`
    : body
      ? `<div class="cremona-empty__body"><p>${body}</p></div>`
      : '';
  const actionsBlock = actionsHtml ? `<div class="cremona-empty__actions">${actionsHtml}</div>` : '';
  const footerBlock = footerHtml ? `<div class="cremona-empty__footer">${footerHtml}</div>` : '';
  return `
    <div class="cremona-empty" data-size="${size}" role="region" aria-labelledby="${titleId}">
      ${illustration}
      <div class="cremona-empty__content">
        <${titleTag} id="${titleId}" class="cremona-empty__title">${title}</${titleTag}>
        ${bodyBlock}
        ${actionsBlock}
        ${footerBlock}
      </div>
    </div>
  `;
}

function button(label, variant = 'primary', size = 'md') {
  return `<button type="button" class="cremona-button" data-variant="${variant}" data-size="${size}"><span class="cremona-button__label">${label}</span></button>`;
}

function kbd(...keys) {
  const inner = keys.map((k) => `<kbd class="cremona-kbd__key">${k}</kbd>`).join('<span class="cremona-kbd__sep" aria-hidden="true">+</span>');
  return `<kbd class="cremona-kbd" data-size="sm">${inner}</kbd>`;
}

function block(html, label) {
  return `
    <div class="empty-story__block">
      ${label ? `<code class="empty-story__blocklabel">${label}</code>` : ''}
      <div class="empty-story__blockcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  noResultsTitle:    t('theme.empty.story.sample.no-results-title'),
  noResultsBody:     t('theme.empty.story.sample.no-results-body'),
  noProjectsTitle:   t('theme.empty.story.sample.no-projects-title'),
  noProjectsBody:    t('theme.empty.story.sample.no-projects-body'),
  noTeamTitle:       t('theme.empty.story.sample.no-team-title'),
  noTeamBody:        t('theme.empty.story.sample.no-team-body'),
  noNotificationsTitle: t('theme.empty.story.sample.no-notifications-title'),
  noNotificationsBody:  t('theme.empty.story.sample.no-notifications-body'),
  noFavoritesTitle:  t('theme.empty.story.sample.no-favorites-title'),
  noFavoritesBody:   t('theme.empty.story.sample.no-favorites-body'),
  page404Title:      t('theme.empty.story.sample.404-title'),
  page404Body:       t('theme.empty.story.sample.404-body'),
  longTitle:         t('theme.empty.story.sample.long-title'),
  longBodyP1:        t('theme.empty.story.sample.long-body-p1'),
  longBodyP2:        t('theme.empty.story.sample.long-body-p2'),
  ctaClearFilters:   t('theme.empty.story.sample.cta-clear-filters'),
  ctaCreateFirst:    t('theme.empty.story.sample.cta-create-first'),
  ctaSeeExamples:    t('theme.empty.story.sample.cta-see-examples'),
  ctaInviteTeam:     t('theme.empty.story.sample.cta-invite-team'),
  ctaHome:           t('theme.empty.story.sample.cta-home'),
  ctaBack:           t('theme.empty.story.sample.cta-back'),
  kbdHint:           t('theme.empty.story.sample.kbd-hint'),
};

const HERO_404_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160" role="presentation">
  <defs>
    <linearGradient id="empty-hero-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--color-primary-soft)"/>
      <stop offset="1" stop-color="var(--color-bg-elevated)"/>
    </linearGradient>
  </defs>
  <rect x="40" y="50" width="120" height="90" rx="10" fill="url(#empty-hero-grad)" stroke="var(--color-border-default)" stroke-width="2"/>
  <path d="M40 50 L60 28 L120 28 L100 50 Z" fill="var(--color-primary-soft)" stroke="var(--color-border-default)" stroke-width="2"/>
  <line x1="60" y1="85"  x2="140" y2="85"  stroke="var(--color-border-subtle)" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round"/>
  <line x1="60" y1="105" x2="120" y2="105" stroke="var(--color-border-subtle)" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round"/>
  <line x1="60" y1="125" x2="135" y2="125" stroke="var(--color-border-subtle)" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round"/>
</svg>`;

const bodyHtml = `
  <section class="empty-story" data-testid="empty-root">
    <header class="empty-story__header">
      <h1>${t('theme.empty.story.title')}</h1>
      <p>${t('theme.empty.story.subtitle')}</p>
    </header>

    <section class="empty-story__section" aria-labelledby="empty-section-default">
      <h2 id="empty-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.empty.story.section.default')}</h2>
      <p class="empty-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.empty.story.explainer.default')}</p>
      <div class="empty-story__stack">
        ${block(renderEmpty({
          title: SAMPLES.noResultsTitle,
          body: SAMPLES.noResultsBody,
          iconName: 'search',
          actionsHtml: button(SAMPLES.ctaClearFilters, 'secondary'),
        }), 'md · search no-results pattern')}
      </div>
    </section>

    <section class="empty-story__section" aria-labelledby="empty-section-sizes">
      <h2 id="empty-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.empty.story.section.sizes')}</h2>
      <p class="empty-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.empty.story.explainer.sizes')}</p>
      <div class="empty-story__stack">
        ${block(renderEmpty({
          size: 'sm',
          title: SAMPLES.noNotificationsTitle,
          body: SAMPLES.noNotificationsBody,
          iconName: 'bell',
        }), 'sm · in-card (no actions)')}
        ${block(renderEmpty({
          size: 'md',
          title: SAMPLES.noFavoritesTitle,
          body: SAMPLES.noFavoritesBody,
          iconName: 'star',
          actionsHtml: button(SAMPLES.ctaSeeExamples, 'secondary', 'sm'),
        }), 'md · section-level (default)')}
        ${block(renderEmpty({
          size: 'lg',
          titleLevel: 'h1',
          title: SAMPLES.page404Title,
          body: SAMPLES.page404Body,
          illustrationHtml: HERO_404_SVG,
          actionsHtml: `${button(SAMPLES.ctaHome, 'primary')}${button(SAMPLES.ctaBack, 'secondary')}`,
        }), 'lg · page-level hero (404 pattern)')}
      </div>
    </section>

    <section class="empty-story__section" aria-labelledby="empty-section-hero">
      <h2 id="empty-section-hero" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.empty.story.section.hero')}</h2>
      <p class="empty-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.empty.story.explainer.hero')}</p>
      <div class="empty-story__stack">
        ${block(renderEmpty({
          size: 'lg',
          titleLevel: 'h1',
          title: SAMPLES.noProjectsTitle,
          body: SAMPLES.noProjectsBody,
          illustrationHtml: HERO_404_SVG,
          actionsHtml: `${button(SAMPLES.ctaCreateFirst, 'primary')}${button(SAMPLES.ctaSeeExamples, 'secondary')}`,
          footerHtml: `${SAMPLES.kbdHint} ${kbd('Cmd', 'N')}`,
        }), 'lg · custom inline SVG + primary + secondary + kbd hint')}
      </div>
    </section>

    <section class="empty-story__section" aria-labelledby="empty-section-composition">
      <h2 id="empty-section-composition" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.empty.story.section.composition')}</h2>
      <p class="empty-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.empty.story.explainer.composition')}</p>
      <div class="empty-story__stack">
        ${block(`
          <article class="cremona-card" data-variant="surface">
            <div class="cremona-card__body">
              ${renderEmpty({
                size: 'md',
                title: SAMPLES.noTeamTitle,
                body: SAMPLES.noTeamBody,
                iconName: 'user',
                actionsHtml: button(SAMPLES.ctaInviteTeam, 'primary', 'sm'),
              })}
            </div>
          </article>
        `, 'Empty inside Card body block')}
      </div>
    </section>

    <section class="empty-story__section" aria-labelledby="empty-section-full">
      <h2 id="empty-section-full" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.empty.story.section.full-anatomy')}</h2>
      <p class="empty-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.empty.story.explainer.full-anatomy')}</p>
      <div class="empty-story__stack">
        ${block(renderEmpty({
          title: SAMPLES.noProjectsTitle,
          body: SAMPLES.noProjectsBody,
          iconName: 'star',
          actionsHtml: `${button(SAMPLES.ctaCreateFirst, 'primary')}${button(SAMPLES.ctaSeeExamples, 'secondary')}`,
          footerHtml: `${SAMPLES.kbdHint} ${kbd('Cmd', 'N')}`,
        }), 'md · primary + secondary + kbd hint')}
      </div>
    </section>

    <section class="empty-story__section" aria-labelledby="empty-section-long">
      <h2 id="empty-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.empty.story.section.long-content')}</h2>
      <div class="empty-story__stack">
        ${block(renderEmpty({
          size: 'lg',
          titleLevel: 'h1',
          title: SAMPLES.longTitle,
          bodyHtml: `<p>${SAMPLES.longBodyP1}</p><p>${SAMPLES.longBodyP2}</p>`,
          illustrationHtml: HERO_404_SVG,
          actionsHtml: button(SAMPLES.ctaCreateFirst, 'primary'),
        }), 'lg · long title + multi-paragraph (+30 % FR)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Empty" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="empty-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="empty-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.empty-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.empty-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.empty-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.empty-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.empty-story__stack { display: grid; gap: var(--spacing-4); }
.empty-story__block { display: grid; gap: var(--spacing-2); }
.empty-story__blocklabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.empty-story__blockcontent { min-inline-size: 0; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); padding: var(--spacing-2); }
.empty-story__explainer { max-inline-size: 70ch; }
.empty-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
