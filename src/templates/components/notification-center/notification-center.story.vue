<!--
  NotificationCenter story — 4 viewport variants.
  Sections : open-with-unread · all-read · empty.
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
  return `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='20' fill='${color}'/><text x='20' y='26' font-family='sans-serif' font-size='18' fill='white' text-anchor='middle'>${initial}</text></svg>" alt="" class="theme-avatar" data-size="md">`;
}

function renderItem({ id, avatarHtml, title, body, timestamp, unread, href }) {
  const relativeTime = formatRelative(timestamp, { baseDate: now });
  return `
    <li class="theme-notification-center__item"${unread ? ' data-unread="true"' : ''}>
      <a href="${href}" class="theme-notification-center__item-link" data-notification-id="${id}">
        ${avatarHtml}
        <div class="theme-notification-center__item-body">
          <p class="theme-notification-center__item-title">${title}</p>
          <p class="theme-notification-center__item-text">${body}</p>
          <time class="theme-notification-center__item-time" datetime="${timestamp}">${relativeTime}</time>
        </div>
        ${unread ? `<span class="theme-notification-center__unread-dot" aria-label="${t('theme.notification-center.unread')}"></span>` : ''}
      </a>
    </li>
  `;
}

function renderCenter({ id = 'story-notification-center', notifications, showMarkAll = true }) {
  const unreadCount = notifications.filter(n => n.unread).length;
  const isEmpty = notifications.length === 0;
  return `
    <dialog class="theme-sheet theme-notification-center" id="${id}" aria-labelledby="${id}-title" open>
      <header class="theme-notification-center__header">
        <h2 id="${id}-title" class="theme-typography theme-notification-center__title" data-variant="h2">${t('theme.notification-center.title')}</h2>
        ${unreadCount > 0 ? `<span class="theme-badge theme-notification-center__badge" data-variant="primary" data-size="sm">${unreadCount}</span>` : ''}
        <button type="button" class="theme-button theme-button--ghost theme-notification-center__close" aria-label="${t('theme.notification-center.close')}"><svg class="theme-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-x"/></svg></button>
      </header>
      ${isEmpty ? `
        <div class="theme-notification-center__empty">
          <div class="theme-empty" data-size="md">
            <div class="theme-empty__illustration" aria-hidden="true"><svg class="theme-icon" data-size="lg"><use href="#icon-bell"/></svg></div>
            <h3 class="theme-empty__title">${t('theme.notification-center.empty.title')}</h3>
            <p class="theme-empty__body">${t('theme.notification-center.empty.body')}</p>
          </div>
        </div>
      ` : `
        <ul class="theme-notification-center__list">${notifications.map(renderItem).join('')}</ul>
        ${showMarkAll && unreadCount > 0 ? `
          <footer class="theme-notification-center__footer">
            <button type="button" class="theme-button theme-button--ghost">${t('theme.notification-center.mark-all-read')}</button>
          </footer>
        ` : ''}
      `}
    </dialog>
  `;
}

const notifsMixed = [
  { id: 'n-1', avatarHtml: renderAvatar('M', '%2310b981'), title: t('theme.notification-center.story.notif.1.title'), body: t('theme.notification-center.story.notif.1.body'), timestamp: new Date('2026-05-14T11:45:00Z'), unread: true, href: '#1' },
  { id: 'n-2', avatarHtml: renderAvatar('L', '%23a855f7'), title: t('theme.notification-center.story.notif.2.title'), body: t('theme.notification-center.story.notif.2.body'), timestamp: new Date('2026-05-14T10:30:00Z'), unread: true, href: '#2' },
  { id: 'n-3', avatarHtml: renderAvatar('A', '%23f59e0b'), title: t('theme.notification-center.story.notif.3.title'), body: t('theme.notification-center.story.notif.3.body'), timestamp: new Date('2026-05-13T16:20:00Z'), unread: false, href: '#3' },
];
const notifsAllRead = notifsMixed.map(n => ({ ...n, unread: false }));

const bodyHtml = `
  <section class="notification-center-story" aria-labelledby="notification-center-story-title">
    <header class="notification-center-story__header">
      <h1 id="notification-center-story-title">${t('theme.notification-center.story.title')}</h1>
      <p>${t('theme.notification-center.story.subtitle')}</p>
    </header>

    <section class="notification-center-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.notification-center.story.section.unread')}</h2>
      <div class="notification-center-story__frame">${renderCenter({ id: 'story-unread', notifications: notifsMixed })}</div>
    </section>

    <section class="notification-center-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.notification-center.story.section.all-read')}</h2>
      <div class="notification-center-story__frame">${renderCenter({ id: 'story-all-read', notifications: notifsAllRead, showMarkAll: false })}</div>
    </section>

    <section class="notification-center-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.notification-center.story.section.empty')}</h2>
      <div class="notification-center-story__frame">${renderCenter({ id: 'story-empty', notifications: [] })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/NotificationCenter" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="notification-center-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="notification-center-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.notification-center-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.notification-center-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.notification-center-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.notification-center-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.notification-center-story__frame { display: flex; justify-content: flex-end; min-block-size: 480px; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; }
.notification-center-story__frame .theme-notification-center { position: static; transform: none; box-shadow: var(--shadow-3); }
.notification-center-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
