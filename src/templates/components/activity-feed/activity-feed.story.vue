<!--
  ActivityFeed story — 4 viewport variants.
  Sections : full-with-buckets · today-only · empty-state.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { formatRelative, setDayjsLocale } from '../../../js/utils/format-date.js';

setTranslations('fr', frDict);
setLocale('fr');
setDayjsLocale('fr');

const now = new Date('2026-05-14T12:00:00Z');

function renderAvatar(initial, color = '%236366f1') {
  return `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='20' fill='${color}'/><text x='20' y='26' font-family='sans-serif' font-size='18' fill='white' text-anchor='middle'>${initial}</text></svg>" alt="" class="cremona-avatar" data-size="md">`;
}

function renderEntry(entry) {
  const relTime = formatRelative(entry.timestamp, { baseDate: now });
  return `
    <li class="cremona-activity-feed__entry">
      ${entry.avatarHtml}
      <div class="cremona-activity-feed__entry-body">
        <p class="cremona-activity-feed__entry-line">
          <strong>${entry.actor}</strong> ${entry.verb} <a href="${entry.targetHref || '#'}">${entry.target}</a>
        </p>
        ${entry.body ? `<p class="cremona-activity-feed__entry-text">${entry.body}</p>` : ''}
        <time class="cremona-activity-feed__entry-time" datetime="${entry.timestamp.toISOString()}">${relTime}</time>
      </div>
    </li>
  `;
}

function renderFeed({ id = 'story-activity-feed', title, entries }) {
  const buckets = ['today', 'yesterday', 'this-week', 'older'];
  return `
    <section class="cremona-activity-feed" id="${id}" aria-labelledby="${id}-title">
      <header class="cremona-activity-feed__header">
        <h2 id="${id}-title" class="cremona-typography cremona-activity-feed__title" data-variant="h2">${title}</h2>
      </header>
      ${entries.length === 0 ? `
        <div class="cremona-activity-feed__empty">
          <div class="cremona-empty" data-size="md">
            <div class="cremona-empty__illustration" aria-hidden="true"><svg class="cremona-icon" data-size="lg"><use href="#icon-star"/></svg></div>
            <h3 class="cremona-empty__title">${t('theme.activity-feed.empty.title')}</h3>
            <p class="cremona-empty__body">${t('theme.activity-feed.empty.body')}</p>
          </div>
        </div>
      ` : `
        <div class="cremona-activity-feed__buckets">
          ${buckets.map(bk => {
            const bucketEntries = entries.filter(e => e.bucket === bk);
            if (bucketEntries.length === 0) return '';
            return `
              <section class="cremona-activity-feed__bucket">
                <h3 class="cremona-typography cremona-activity-feed__bucket-heading" data-variant="overline">${t('theme.activity-feed.bucket.' + bk)}</h3>
                <ul class="cremona-activity-feed__entries">${bucketEntries.map(renderEntry).join('')}</ul>
              </section>
            `;
          }).join('')}
        </div>
      `}
    </section>
  `;
}

const title = t('theme.activity-feed.title');
const entriesFull = [
  { actor: 'Marie Dupont', verb: t('theme.activity-feed.story.verb.commented'), target: t('theme.activity-feed.story.target.project-samurai'), body: '"Excellent travail."', timestamp: new Date('2026-05-14T11:45:00Z'), bucket: 'today', avatarHtml: renderAvatar('M', '%2310b981'), targetHref: '#' },
  { actor: 'Lucie Bernard', verb: t('theme.activity-feed.story.verb.assigned'), target: t('theme.activity-feed.story.target.ticket-42'), timestamp: new Date('2026-05-14T10:20:00Z'), bucket: 'today', avatarHtml: renderAvatar('L', '%23a855f7'), targetHref: '#' },
  { actor: 'Alex Bernard', verb: t('theme.activity-feed.story.verb.completed'), target: t('theme.activity-feed.story.target.milestone-q2'), timestamp: new Date('2026-05-13T16:00:00Z'), bucket: 'yesterday', avatarHtml: renderAvatar('A', '%23f59e0b'), targetHref: '#' },
  { actor: 'Sophie Martin', verb: t('theme.activity-feed.story.verb.created'), target: t('theme.activity-feed.story.target.doc-roadmap'), timestamp: new Date('2026-05-10T14:30:00Z'), bucket: 'this-week', avatarHtml: renderAvatar('S', '%23ef4444'), targetHref: '#' },
];

const bodyHtml = `
  <section class="activity-feed-story" aria-labelledby="activity-feed-story-title">
    <header class="activity-feed-story__header">
      <h1 id="activity-feed-story-title">${t('theme.activity-feed.story.title')}</h1>
      <p>${t('theme.activity-feed.story.subtitle')}</p>
    </header>

    <section class="activity-feed-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.activity-feed.story.section.full')}</h2>
      <div class="activity-feed-story__frame">${renderFeed({ id: 'story-full', title, entries: entriesFull })}</div>
    </section>

    <section class="activity-feed-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.activity-feed.story.section.empty')}</h2>
      <div class="activity-feed-story__frame">${renderFeed({ id: 'story-empty', title, entries: [] })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/ActivityFeed" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="activity-feed-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="activity-feed-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.activity-feed-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.activity-feed-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.activity-feed-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.activity-feed-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.activity-feed-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.activity-feed-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
