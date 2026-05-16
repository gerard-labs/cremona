<!--
  Calendar story — 4 viewport variants (Light/Dark × LTR/RTL).
  Composes 7-column day grid + month nav + locale-aware Intl labels.

  Sections:
   1. Default (current month, week starts Monday)
   2. With value pre-selected (today)
   3. With min / max (bounded range)
   4. With disabledWeekdays (sat + sun disabled)
   5. Locale FR vs EN (side-by-side)
   6. Events log
-->
<script setup>
import { onMounted, ref } from 'vue';
import { Application } from '@hotwired/stimulus';
import frDict from '../../../js/i18n/fr.json';
import enDict from '../../../js/i18n/en.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import CalendarController from '../../../js/controllers/calendar_controller.js';

setTranslations('fr', frDict);
setTranslations('en', enDict);
setLocale('fr');

function isoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function ymToday() {
  return isoToday().slice(0, 7);
}

const todayIso = isoToday();
const todayYm = ymToday();

function renderCalendar({
  id = 'cal-default',
  value = '',
  min = '',
  max = '',
  displayMonth = todayYm,
  weekStart = 1,
  locale = 'fr',
  disabledWeekdays = '',
} = {}) {
  const prevAria = t('theme.calendar.aria.previous-month');
  const nextAria = t('theme.calendar.aria.next-month');
  const calAria = t('theme.calendar.aria.calendar');
  const attrs = [
    `data-controller="calendar"`,
    `data-action="keydown->calendar#onKeydown click->calendar#onDayClick"`,
    `data-calendar-week-start-value="${weekStart}"`,
    `data-calendar-locale-value="${locale}"`,
    `data-calendar-display-month-value="${displayMonth}"`,
  ];
  if (value) attrs.push(`data-calendar-value-value="${value}"`);
  if (min) attrs.push(`data-calendar-min-value="${min}"`);
  if (max) attrs.push(`data-calendar-max-value="${max}"`);
  if (disabledWeekdays) attrs.push(`data-calendar-disabled-weekdays-value="${disabledWeekdays}"`);
  return `
    <div id="${id}" class="cremona-calendar" ${attrs.join(' ')}>
      <header class="cremona-calendar__header">
        <button type="button" class="cremona-button cremona-calendar__nav" data-variant="ghost" data-size="sm"
          data-calendar-target="prevButton"
          data-action="click->calendar#prevMonth"
          aria-label="${prevAria}">
          <svg class="cremona-icon cremona-icon-bidi" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="cremona-calendar__month-label" id="${id}-month" data-calendar-target="monthLabel" aria-live="polite" aria-atomic="true"></h2>
        <button type="button" class="cremona-button cremona-calendar__nav" data-variant="ghost" data-size="sm"
          data-calendar-target="nextButton"
          data-action="click->calendar#nextMonth"
          aria-label="${nextAria}">
          <svg class="cremona-icon cremona-icon-bidi" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </header>
      <div class="cremona-calendar__weekdays" data-calendar-target="weekdays" aria-hidden="true"></div>
      <div class="cremona-calendar__grid" id="${id}-grid" role="grid" aria-labelledby="${id}-month" aria-label="${calAria}" data-calendar-target="grid"></div>
    </div>
  `;
}

const eventsLogId = 'cal-events-log';
const sectionTitle = (id, key) => `<h2 id="${id}" class="cremona-typography" data-variant="overline" data-color="tertiary">${t(key)}</h2>`;
const sectionExplainer = (key) => `<p class="cremona-typography" data-variant="caption" data-color="tertiary">${t(key)}</p>`;

onMounted(() => {
  if (!document.body.dataset.calendarStoryBooted) {
    const app = Application.start();
    app.register('calendar', CalendarController);
    document.body.dataset.calendarStoryBooted = '1';

    // Wire events log (single global log capturing every Calendar event).
    const log = document.getElementById(eventsLogId);
    if (log) {
      const append = (text) => {
        const entry = document.createElement('li');
        entry.className = 'cremona-typography';
        entry.dataset.variant = 'body';
        entry.dataset.color = 'secondary';
        entry.textContent = text;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
      };
      document.addEventListener('calendar:select', (e) => {
        append(`calendar:select → iso=${e.detail.iso}`);
      });
      document.addEventListener('calendar:display-month-change', (e) => {
        append(`calendar:display-month-change → ${e.detail.month} (${e.detail.label})`);
      });
    }
  }
});

const bodyHtml = `
  <section class="cal-story" data-testid="calendar-root">
    <header class="cal-story__header">
      <h1>${t('theme.calendar.story.title')}</h1>
      <p>${t('theme.calendar.story.subtitle')}</p>
    </header>

    <section class="cal-story__section" aria-labelledby="cal-section-default">
      ${sectionTitle('cal-section-default', 'theme.calendar.story.section.default')}
      ${sectionExplainer('theme.calendar.story.section.default-explainer')}
      <div class="cal-story__row">
        ${renderCalendar({ id: 'cal-default' })}
      </div>
    </section>

    <section class="cal-story__section" aria-labelledby="cal-section-with-value">
      ${sectionTitle('cal-section-with-value', 'theme.calendar.story.section.with-value')}
      ${sectionExplainer('theme.calendar.story.section.with-value-explainer')}
      <div class="cal-story__row">
        ${renderCalendar({ id: 'cal-with-value', value: todayIso, displayMonth: todayYm })}
      </div>
    </section>

    <section class="cal-story__section" aria-labelledby="cal-section-min-max">
      ${sectionTitle('cal-section-min-max', 'theme.calendar.story.section.min-max')}
      ${sectionExplainer('theme.calendar.story.section.min-max-explainer')}
      <div class="cal-story__row">
        ${renderCalendar({ id: 'cal-min-max', displayMonth: '2026-05', min: '2026-05-10', max: '2026-05-20', value: '2026-05-15' })}
      </div>
    </section>

    <section class="cal-story__section" aria-labelledby="cal-section-disabled-weekdays">
      ${sectionTitle('cal-section-disabled-weekdays', 'theme.calendar.story.section.disabled-weekdays')}
      ${sectionExplainer('theme.calendar.story.section.disabled-weekdays-explainer')}
      <div class="cal-story__row">
        ${renderCalendar({ id: 'cal-weekends', displayMonth: '2026-05', disabledWeekdays: '0,6' })}
      </div>
    </section>

    <section class="cal-story__section" aria-labelledby="cal-section-locale">
      ${sectionTitle('cal-section-locale', 'theme.calendar.story.section.locale')}
      ${sectionExplainer('theme.calendar.story.section.locale-explainer')}
      <div class="cal-story__row">
        ${renderCalendar({ id: 'cal-fr', displayMonth: '2026-05', locale: 'fr', weekStart: 1 })}
        ${renderCalendar({ id: 'cal-en', displayMonth: '2026-05', locale: 'en', weekStart: 0 })}
      </div>
    </section>

    <section class="cal-story__section" aria-labelledby="cal-section-events">
      ${sectionTitle('cal-section-events', 'theme.calendar.story.section.events')}
      ${sectionExplainer('theme.calendar.story.section.events-explainer')}
      <div class="cal-story__events">
        <p class="cremona-typography" data-variant="caption" data-color="secondary">${t('theme.calendar.story.sample.events-log-label')}</p>
        <ol id="${eventsLogId}" class="cal-story__log" aria-live="polite"></ol>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Calendar" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="cal-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="cal-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.cal-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.cal-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.cal-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.cal-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.cal-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: flex-start; }
.cal-story__events { display: grid; gap: var(--spacing-2); }
.cal-story__log { list-style: none; padding: var(--spacing-3); margin: 0; background: var(--color-bg-base); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle); max-block-size: 200px; overflow-y: auto; font-family: var(--font-mono); font-size: var(--font-size-xs); }
.cal-story__log:empty::before { content: 'No events yet.'; color: var(--color-text-tertiary); font-family: var(--font-sans); }
.cal-story__log li { padding-block: var(--spacing-1); border-block-end: 1px dashed var(--color-border-subtle); }
.cal-story__log li:last-child { border-block-end: 0; }
.cal-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
