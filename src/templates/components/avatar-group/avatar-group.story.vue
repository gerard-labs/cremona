<!--
  AvatarGroup story — 4 viewport variants (Light/Dark × LTR/RTL).
  Pure-CSS primitive ; 0 controller ; composes Avatar via consumer items.

  Sections:
   1. Default (4 visible, no overflow) — with names + initials mix
   2. Overflow (+N indicator with Intl.PluralRules-resolved label)
   3. Sizes (xs / sm / md / lg / xl)
   4. With status dots — overlapping avatars with visible status
   5. Single-avatar edge case
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const ICON_MODULES = import.meta.glob('../../../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const ICONS = Object.fromEntries(
  Object.entries(ICON_MODULES).map(([path, raw]) => [
    path.match(/([^/]+)\.svg$/)[1],
    raw,
  ]),
);

function renderAvatar({ src, alt = '', initials, name = '', size = 'md', status, statusLabel, hue }) {
  const classes = ['cremona-avatar'];
  if (status) classes.push('cremona-avatar--has-status');
  const styleAttr = hue ? ` style="--cremona-avatar-hue: var(--color-kpi-${hue})"` : '';
  const showIconFallback = !src && !initials;
  let inner;
  if (src) {
    inner = `<img class="cremona-avatar__img" data-avatar-fallback-target="img" src="${src}" alt="${alt}">`;
  } else if (showIconFallback) {
    const iconSize = ['xs', 'sm'].includes(size) ? 'sm' : size === 'xl' ? 'xl' : 'lg';
    inner = `<span class="cremona-icon" data-icon="user" data-size="${iconSize}" aria-hidden="true" role="presentation">${ICONS.user || ''}</span>`;
  } else {
    inner = `<span class="cremona-avatar__fallback" aria-hidden="true">${initials}</span>`;
  }
  const ctrlAttrs = src ? ` data-controller="avatar-fallback" data-avatar-fallback-name-value="${name}" data-avatar-fallback-initials-value="${initials || ''}"` : '';
  const statusHtml = status ? `<span class="cremona-avatar__status" data-status="${status}" role="status" aria-label="${statusLabel || status}"></span>` : '';
  return `<span class="${classes.join(' ')}" data-size="${size}"${ctrlAttrs}${styleAttr}>${inner}${statusHtml}</span>`;
}

function renderGroup({ avatars, max = 4, size = 'md', moreLabel, moreAria, groupAria, className }) {
  const classes = ['cremona-avatar-group'];
  if (className) classes.push(className);
  const total = avatars.length;
  const hasOverflow = total > max;
  const visibleCount = hasOverflow ? max - 1 : total;
  const remaining = total - visibleCount;
  const effectiveMoreLabel = moreLabel ?? `+${remaining}`;
  const effectiveMoreAria = moreAria ?? effectiveMoreLabel;

  const visibleHtml = avatars
    .slice(0, visibleCount)
    .map((a) => renderAvatar({ ...a, size }))
    .join('');
  const overflowHtml = hasOverflow
    ? `<span class="cremona-avatar cremona-avatar-group__more" data-size="${size}" role="img" aria-label="${effectiveMoreAria}"><span class="cremona-avatar-group__more-label" aria-hidden="true">${effectiveMoreLabel}</span></span>`
    : '';
  const groupAriaAttr = groupAria ? ` role="group" aria-label="${groupAria}"` : '';

  return `<span class="${classes.join(' ')}" data-size="${size}"${groupAriaAttr}>${visibleHtml}${overflowHtml}</span>`;
}

const AVATARS_4 = [
  { initials: 'MD', name: 'Marie Dupont',  hue: 1 },
  { initials: 'AB', name: 'Alex Bernard',  hue: 3 },
  { initials: 'TL', name: 'Théo Laurent',  hue: 5 },
  { initials: 'LD', name: 'Lucie Dubois',  hue: 6 },
];

const AVATARS_8 = [
  ...AVATARS_4,
  { initials: 'PR', name: 'Paul Renaud',   hue: 2 },
  { initials: 'SC', name: 'Sophie Caron',  hue: 4 },
  { initials: 'EM', name: 'Emma Martin',   hue: 1 },
  { initials: 'JG', name: 'Jules Girard',  hue: 3 },
];

const AVATARS_12 = [
  ...AVATARS_8,
  { initials: 'CV', name: 'Claire Vidal',  hue: 5 },
  { initials: 'NB', name: 'Nina Blanc',    hue: 6 },
  { initials: 'RM', name: 'Rémi Moreau',   hue: 2 },
  { initials: 'IL', name: 'Inès Leroy',    hue: 4 },
];

const AVATARS_WITH_STATUS = AVATARS_4.map((a, i) => ({
  ...a,
  status: ['online', 'busy', 'away', 'offline'][i],
  statusLabel: t(['theme.avatar-group.story.status.online', 'theme.avatar-group.story.status.busy', 'theme.avatar-group.story.status.away', 'theme.avatar-group.story.status.offline'][i]),
}));

// Compose accessible group label using Intl.ListFormat — pre-resolved.
function listLabel(names, more = 0) {
  const lf = new Intl.ListFormat('fr', { style: 'long', type: 'conjunction' });
  if (more > 0) {
    const moreLabel = t('theme.avatar-group.aria.more', { count: more });
    return `${lf.format(names)} ${moreLabel}`;
  }
  return lf.format(names);
}

const bodyHtml = `
  <section class="ag-story" data-testid="avatar-group-root">
    <header class="ag-story__header">
      <h1>${t('theme.avatar-group.story.title')}</h1>
      <p>${t('theme.avatar-group.story.subtitle')}</p>
    </header>

    <section class="ag-story__section" aria-labelledby="ag-section-default">
      <h2 id="ag-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar-group.story.section.default')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.avatar-group.story.section.default-explainer')}</p>
      <div class="ag-story__row">
        ${renderGroup({ avatars: AVATARS_4, max: 4, groupAria: t('theme.avatar-group.story.aria.team') + ' : ' + listLabel(AVATARS_4.map((a) => a.name)) })}
      </div>
    </section>

    <section class="ag-story__section" aria-labelledby="ag-section-overflow">
      <h2 id="ag-section-overflow" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar-group.story.section.overflow')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.avatar-group.story.section.overflow-explainer')}</p>
      <div class="ag-story__row ag-story__row--vertical">
        <div>
          <p class="cremona-typography" data-variant="caption" data-color="secondary">${t('theme.avatar-group.story.label.team-of-8')}</p>
          ${renderGroup({
            avatars: AVATARS_8,
            max: 5,
            moreAria: t('theme.avatar-group.aria.more', { count: 4 }),
            groupAria: t('theme.avatar-group.story.aria.team') + ' : ' + listLabel(AVATARS_8.slice(0, 4).map((a) => a.name), 4),
          })}
        </div>
        <div>
          <p class="cremona-typography" data-variant="caption" data-color="secondary">${t('theme.avatar-group.story.label.team-of-12')}</p>
          ${renderGroup({
            avatars: AVATARS_12,
            max: 4,
            moreAria: t('theme.avatar-group.aria.more', { count: 9 }),
            groupAria: t('theme.avatar-group.story.aria.team') + ' : ' + listLabel(AVATARS_12.slice(0, 3).map((a) => a.name), 9),
          })}
        </div>
        <div>
          <p class="cremona-typography" data-variant="caption" data-color="secondary">${t('theme.avatar-group.story.label.team-of-5')}</p>
          ${renderGroup({
            avatars: AVATARS_4.concat([{ initials: 'PR', name: 'Paul Renaud', hue: 2 }]),
            max: 4,
            moreAria: t('theme.avatar-group.aria.more', { count: 1 }),
            groupAria: t('theme.avatar-group.story.aria.team') + ' : ' + listLabel(AVATARS_4.slice(0, 3).map((a) => a.name), 2),
          })}
        </div>
      </div>
    </section>

    <section class="ag-story__section" aria-labelledby="ag-section-sizes">
      <h2 id="ag-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar-group.story.section.sizes')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.avatar-group.story.section.sizes-explainer')}</p>
      <div class="ag-story__row ag-story__row--vertical">
        ${['xs', 'sm', 'md', 'lg', 'xl'].map((size) => `<div class="ag-story__size-row"><span class="cremona-typography" data-variant="caption" data-color="secondary">${size}</span>${renderGroup({ avatars: AVATARS_4, max: 4, size })}</div>`).join('')}
      </div>
    </section>

    <section class="ag-story__section" aria-labelledby="ag-section-status">
      <h2 id="ag-section-status" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar-group.story.section.status')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.avatar-group.story.section.status-explainer')}</p>
      <div class="ag-story__row">
        ${renderGroup({ avatars: AVATARS_WITH_STATUS, max: 4, groupAria: t('theme.avatar-group.story.aria.online-team') })}
      </div>
    </section>

    <section class="ag-story__section" aria-labelledby="ag-section-single">
      <h2 id="ag-section-single" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.avatar-group.story.section.single')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.avatar-group.story.section.single-explainer')}</p>
      <div class="ag-story__row">
        ${renderGroup({ avatars: [AVATARS_4[0]], max: 4, groupAria: t('theme.avatar-group.story.aria.single') + ' : ' + AVATARS_4[0].name })}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Avatar Group" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="ag-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="ag-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.ag-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.ag-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.ag-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.ag-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.ag-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: center; }
.ag-story__row--vertical { flex-direction: column; align-items: flex-start; gap: var(--spacing-3); }
.ag-story__size-row { display: flex; align-items: center; gap: var(--spacing-3); }
.ag-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
