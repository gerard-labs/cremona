<!--
  HoverCard story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Default — inline @mention link with avatar preview.
    2. With avatar + bio — typical user-mention pattern.
    3. With actions footer — preview + Follow/Message buttons.
    4. Long content — multi-paragraph article preview.
    5. Custom delays — 100 ms open + 50 ms close (snappier for demo).

  Stimulus controllers `popover` + `hover-card` co-mounted on each wrap.
  Per OQ-29: no new motion tokens — delays are JS-side timeouts in the
  hover-card controller. Focus on trigger does NOT open (HoverCard is
  visual preview, not descriptive metadata).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import userSvg from '../../../assets/icons/user.svg?raw';
import starSvg from '../../../assets/icons/star.svg?raw';

const ICONS = { user: userSvg, star: starSvg };

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

let _hcCounter = 0;
function nextId() { return `hc-${++_hcCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function avatarPreview(initials, color = 'primary') {
  return `<span class="cremona-avatar" data-size="md" style="background:var(--color-${color}-soft);color:var(--color-${color}-soft-foreground)" aria-hidden="true">${initials}</span>`;
}

function renderHoverCard({ placement = 'top', openDelay = 400, closeDelay = 200, triggerHtml, contentHtml }) {
  const id = nextId();
  return `
    <span class="cremona-popover cremona-hover-card"
      data-controller="popover hover-card"
      data-action="mouseenter->hover-card#enter mouseleave->hover-card#leave keydown.esc@window->popover#close"
      data-popover-placement-value="${placement}"
      data-popover-offset-value="8"
      data-popover-open-value="false"
      data-hover-card-open-delay-value="${openDelay}"
      data-hover-card-close-delay-value="${closeDelay}">
      ${triggerHtml(id)}
      <div id="${id}"
        class="cremona-popover__content cremona-hover-card__content"
        data-popover-target="content"
        data-state="closed"
        data-placement="${placement}"
        role="dialog"
        hidden>${contentHtml}</div>
    </span>
  `;
}

function mentionTrigger(label) {
  return (id) => `<a class="hover-card-story__mention" data-popover-target="trigger"
    aria-haspopup="dialog" aria-expanded="false" aria-controls="${id}"
    href="#" tabindex="0">@${label}</a>`;
}

function S(key) { return t('theme.hover-card.story.' + key); }

const cardDefault = `
  <div class="cremona-hover-card__header">
    ${avatarPreview('MD')}
    <div>
      <p class="cremona-hover-card__title">${S('sample.default-name')}</p>
      <p class="cremona-hover-card__subtitle">${S('sample.default-role')}</p>
    </div>
  </div>
  <p class="cremona-hover-card__body">${S('sample.default-bio')}</p>
`;

const cardWithBio = `
  <div class="cremona-hover-card__header">
    ${avatarPreview('LD', 'success')}
    <div>
      <p class="cremona-hover-card__title">${S('sample.bio-name')}</p>
      <p class="cremona-hover-card__subtitle">${S('sample.bio-role')}</p>
    </div>
  </div>
  <p class="cremona-hover-card__body">${S('sample.bio-body')}</p>
`;

const cardWithActions = `
  <div class="cremona-hover-card__header">
    ${avatarPreview('AB', 'accent')}
    <div>
      <p class="cremona-hover-card__title">${S('sample.actions-name')}</p>
      <p class="cremona-hover-card__subtitle">${S('sample.actions-role')}</p>
    </div>
  </div>
  <p class="cremona-hover-card__body">${S('sample.actions-body')}</p>
  <div class="cremona-hover-card__footer">
    <button type="button" class="cremona-button" data-variant="primary" data-size="sm">
      <span class="cremona-button__label">${S('sample.actions-follow')}</span>
    </button>
    <button type="button" class="cremona-button" data-variant="secondary" data-size="sm">
      <span class="cremona-button__label">${S('sample.actions-message')}</span>
    </button>
  </div>
`;

const cardLong = `
  <div class="cremona-hover-card__header">
    ${icon('star', 'md')}
    <p class="cremona-hover-card__title">${S('sample.long-title')}</p>
  </div>
  <p class="cremona-hover-card__body">${S('sample.long-body-1')}</p>
  <p class="cremona-hover-card__body">${S('sample.long-body-2')}</p>
`;

const cardSnappy = `
  <div class="cremona-hover-card__header">
    ${avatarPreview('SN', 'info')}
    <div>
      <p class="cremona-hover-card__title">${S('sample.snappy-name')}</p>
      <p class="cremona-hover-card__subtitle">${S('sample.snappy-role')}</p>
    </div>
  </div>
  <p class="cremona-hover-card__body">${S('sample.snappy-body')}</p>
`;

const bodyHtml = `
  <section class="hover-card-story" data-testid="hover-card-root">
    <header class="hover-card-story__header">
      <h1>${t('theme.hover-card.story.title')}</h1>
      <p>${t('theme.hover-card.story.subtitle')}</p>
    </header>

    <section class="hover-card-story__section" aria-labelledby="hc-section-default">
      <h2 id="hc-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.hover-card.story.section.default')}</h2>
      <p class="hover-card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.hover-card.story.explainer.default')}</p>
      <p class="hover-card-story__inline">
        ${t('theme.hover-card.story.sample.default-prefix')}
        ${renderHoverCard({ triggerHtml: mentionTrigger('marie-dupont'), contentHtml: cardDefault })}
        ${t('theme.hover-card.story.sample.default-suffix')}
      </p>
    </section>

    <section class="hover-card-story__section" aria-labelledby="hc-section-bio">
      <h2 id="hc-section-bio" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.hover-card.story.section.bio')}</h2>
      <p class="hover-card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.hover-card.story.explainer.bio')}</p>
      <p class="hover-card-story__inline">
        ${t('theme.hover-card.story.sample.bio-prefix')}
        ${renderHoverCard({ placement: 'bottom', triggerHtml: mentionTrigger('lucie-dubois'), contentHtml: cardWithBio })}
        ${t('theme.hover-card.story.sample.bio-suffix')}
      </p>
    </section>

    <section class="hover-card-story__section" aria-labelledby="hc-section-actions">
      <h2 id="hc-section-actions" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.hover-card.story.section.actions')}</h2>
      <p class="hover-card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.hover-card.story.explainer.actions')}</p>
      <p class="hover-card-story__inline">
        ${t('theme.hover-card.story.sample.actions-prefix')}
        ${renderHoverCard({ triggerHtml: mentionTrigger('alex-bernard'), contentHtml: cardWithActions })}
        ${t('theme.hover-card.story.sample.actions-suffix')}
      </p>
    </section>

    <section class="hover-card-story__section" aria-labelledby="hc-section-long">
      <h2 id="hc-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.hover-card.story.section.long')}</h2>
      <p class="hover-card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.hover-card.story.explainer.long')}</p>
      <p class="hover-card-story__inline">
        ${t('theme.hover-card.story.sample.long-prefix')}
        ${renderHoverCard({ placement: 'right', triggerHtml: mentionTrigger('article-galaxie'), contentHtml: cardLong })}
        ${t('theme.hover-card.story.sample.long-suffix')}
      </p>
    </section>

    <section class="hover-card-story__section" aria-labelledby="hc-section-snappy">
      <h2 id="hc-section-snappy" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.hover-card.story.section.snappy')}</h2>
      <p class="hover-card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.hover-card.story.explainer.snappy')}</p>
      <p class="hover-card-story__inline">
        ${t('theme.hover-card.story.sample.snappy-prefix')}
        ${renderHoverCard({ openDelay: 100, closeDelay: 50, triggerHtml: mentionTrigger('snappy-demo'), contentHtml: cardSnappy })}
        ${t('theme.hover-card.story.sample.snappy-suffix')}
      </p>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/HoverCard" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="hover-card-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="hover-card-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.hover-card-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.hover-card-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.hover-card-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.hover-card-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.hover-card-story__explainer { max-inline-size: 70ch; }
.hover-card-story__inline { font: var(--typography-body); color: var(--color-text-primary); padding-block: var(--spacing-8); line-height: var(--line-height-relaxed); }
.hover-card-story__mention { color: var(--color-primary); font-weight: var(--font-weight-medium); text-decoration: underline; cursor: pointer; }
.hover-card-story__mention:hover { color: var(--color-primary-hover); }
.hover-card-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
