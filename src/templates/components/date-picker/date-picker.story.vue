<!--
  DatePicker story — 4 viewport variants (Light/Dark × LTR/RTL).
  Composes Popover (Floating UI lazy-loaded) + Input trigger + Calendar.

  Sections:
   1. Default (FR long format)
   2. Date formats (long / medium / short / full)
   3. Locales (FR vs EN side-by-side)
   4. With min / max constraints
   5. With Field composition
   6. Events log
-->
<script setup>
import { onMounted } from 'vue';
import { Application } from '@hotwired/stimulus';
import frDict from '../../../js/i18n/fr.json';
import enDict from '../../../js/i18n/en.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import PopoverController from '../../../js/controllers/popover_controller.js';
import CalendarController from '../../../js/controllers/calendar_controller.js';
import DatePickerController from '../../../js/controllers/date-picker_controller.js';

setTranslations('fr', frDict);
setTranslations('en', enDict);
setLocale('fr');

const sectionTitle = (id, key) => `<h2 id="${id}" class="theme-typography" data-variant="overline" data-color="tertiary">${t(key)}</h2>`;
const sectionExplainer = (key) => `<p class="theme-typography" data-variant="caption" data-color="tertiary">${t(key)}</p>`;

function renderDatePicker({
  id = 'dp',
  name = 'date',
  value = '',
  min = '',
  max = '',
  locale = 'fr',
  dateStyle = 'long',
  displayMonth = '2026-05',
  weekStart = 1,
  placeholder = '',
  describedBy = null,
} = {}) {
  const ph = placeholder || t('theme.date-picker.placeholder');
  const inputAria = t('theme.date-picker.aria.input');
  const dialogAria = t('theme.date-picker.aria.dialog');
  const prevAria = t('theme.calendar.aria.previous-month');
  const nextAria = t('theme.calendar.aria.next-month');
  const calAria = t('theme.calendar.aria.calendar');
  return `
    <div id="${id}" class="theme-popover theme-date-picker"
      data-controller="popover date-picker"
      data-action="keydown.esc@window->popover#close calendar:select->date-picker#onCalendarSelect popover:open->date-picker#onPopoverOpen"
      data-popover-placement-value="bottom-start"
      data-popover-offset-value="6"
      data-popover-open-value="false"
      data-date-picker-locale-value="${locale}"
      data-date-picker-date-style-value="${dateStyle}"
      ${value ? `data-date-picker-value-value="${value}"` : ''}
      ${min ? `data-date-picker-min-value="${min}"` : ''}
      ${max ? `data-date-picker-max-value="${max}"` : ''}
    >
      <div class="theme-date-picker__trigger">
        <input id="${id}-input" type="text" class="theme-input theme-date-picker__input"
          data-popover-target="trigger"
          data-date-picker-target="input"
          data-action="click->popover#toggle keydown->date-picker#onTriggerKeydown"
          role="combobox" aria-haspopup="dialog" aria-expanded="false"
          aria-controls="${id}-popover" aria-label="${inputAria}"
          readonly placeholder="${ph}"
          ${describedBy ? `aria-describedby="${describedBy}"` : ''}>
        <svg class="theme-date-picker__icon" aria-hidden="true"
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </div>
      <div id="${id}-popover" class="theme-popover__content theme-date-picker__panel"
        data-popover-target="content" data-state="closed"
        role="dialog" aria-modal="false" aria-labelledby="${id}-dialog-label" hidden>
        <span id="${id}-dialog-label" class="sr-only">${dialogAria}</span>
        <div id="${id}-calendar" class="theme-calendar"
          data-controller="calendar"
          data-action="keydown->calendar#onKeydown click->calendar#onDayClick"
          data-calendar-week-start-value="${weekStart}"
          data-calendar-locale-value="${locale}"
          data-calendar-display-month-value="${displayMonth}"
          ${value ? `data-calendar-value-value="${value}"` : ''}
          ${min ? `data-calendar-min-value="${min}"` : ''}
          ${max ? `data-calendar-max-value="${max}"` : ''}>
          <header class="theme-calendar__header">
            <button type="button" class="theme-button theme-calendar__nav" data-variant="ghost" data-size="sm"
              data-calendar-target="prevButton" data-action="click->calendar#prevMonth" aria-label="${prevAria}">
              <svg class="theme-icon theme-icon-bidi" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 class="theme-calendar__month-label" id="${id}-cal-month" data-calendar-target="monthLabel" aria-live="polite" aria-atomic="true"></h2>
            <button type="button" class="theme-button theme-calendar__nav" data-variant="ghost" data-size="sm"
              data-calendar-target="nextButton" data-action="click->calendar#nextMonth" aria-label="${nextAria}">
              <svg class="theme-icon theme-icon-bidi" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </header>
          <div class="theme-calendar__weekdays" data-calendar-target="weekdays" aria-hidden="true"></div>
          <div class="theme-calendar__grid" id="${id}-cal-grid" role="grid" aria-labelledby="${id}-cal-month" aria-label="${calAria}" data-calendar-target="grid"></div>
        </div>
      </div>
      <input type="hidden" name="${name}" data-date-picker-target="hiddenInput" ${value ? `value="${value}"` : ''}>
    </div>
  `;
}

const eventsLogId = 'dp-events-log';

onMounted(() => {
  if (!document.body.dataset.datePickerStoryBooted) {
    const app = Application.start();
    app.register('popover', PopoverController);
    app.register('calendar', CalendarController);
    app.register('date-picker', DatePickerController);
    document.body.dataset.datePickerStoryBooted = '1';

    const log = document.getElementById(eventsLogId);
    if (log) {
      const append = (text) => {
        const entry = document.createElement('li');
        entry.textContent = text;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
      };
      document.addEventListener('date-picker:change', (e) => {
        append(`date-picker:change → iso=${e.detail.iso} formatted="${e.detail.formatted}"`);
      });
    }
  }
});

const bodyHtml = `
  <section class="dp-story" data-testid="date-picker-root">
    <header class="dp-story__header">
      <h1>${t('theme.date-picker.story.title')}</h1>
      <p>${t('theme.date-picker.story.subtitle')}</p>
    </header>

    <section class="dp-story__section" aria-labelledby="dp-section-default">
      ${sectionTitle('dp-section-default', 'theme.date-picker.story.section.default')}
      ${sectionExplainer('theme.date-picker.story.section.default-explainer')}
      <div class="dp-story__row">
        ${renderDatePicker({ id: 'dp-default', name: 'date-default' })}
      </div>
    </section>

    <section class="dp-story__section" aria-labelledby="dp-section-formats">
      ${sectionTitle('dp-section-formats', 'theme.date-picker.story.section.formats')}
      ${sectionExplainer('theme.date-picker.story.section.formats-explainer')}
      <div class="dp-story__row dp-story__row--wide">
        ${renderDatePicker({ id: 'dp-long', name: 'date-long', value: '2026-05-15', dateStyle: 'long' })}
        ${renderDatePicker({ id: 'dp-medium', name: 'date-medium', value: '2026-05-15', dateStyle: 'medium' })}
        ${renderDatePicker({ id: 'dp-short', name: 'date-short', value: '2026-05-15', dateStyle: 'short' })}
        ${renderDatePicker({ id: 'dp-full', name: 'date-full', value: '2026-05-15', dateStyle: 'full' })}
      </div>
    </section>

    <section class="dp-story__section" aria-labelledby="dp-section-locales">
      ${sectionTitle('dp-section-locales', 'theme.date-picker.story.section.locales')}
      ${sectionExplainer('theme.date-picker.story.section.locales-explainer')}
      <div class="dp-story__row">
        ${renderDatePicker({ id: 'dp-fr', name: 'date-fr', value: '2026-05-15', locale: 'fr', weekStart: 1, dateStyle: 'long' })}
        ${renderDatePicker({ id: 'dp-en', name: 'date-en', value: '2026-05-15', locale: 'en', weekStart: 0, dateStyle: 'long' })}
      </div>
    </section>

    <section class="dp-story__section" aria-labelledby="dp-section-constraints">
      ${sectionTitle('dp-section-constraints', 'theme.date-picker.story.section.constraints')}
      ${sectionExplainer('theme.date-picker.story.section.constraints-explainer')}
      <div class="dp-story__row">
        ${renderDatePicker({ id: 'dp-bounded', name: 'date-bounded', value: '2026-05-15', min: '2026-05-10', max: '2026-05-20' })}
      </div>
    </section>

    <section class="dp-story__section" aria-labelledby="dp-section-field">
      ${sectionTitle('dp-section-field', 'theme.date-picker.story.section.field')}
      ${sectionExplainer('theme.date-picker.story.section.field-explainer')}
      <div class="theme-field" style="max-inline-size: 360px;">
        <label class="theme-label" for="dp-field-input">${t('theme.date-picker.story.field.label')}</label>
        ${renderDatePicker({ id: 'dp-field', name: 'date-field', describedBy: 'dp-field-help' })}
        <p class="theme-field__help" id="dp-field-help">${t('theme.date-picker.story.field.help')}</p>
      </div>
    </section>

    <section class="dp-story__section" aria-labelledby="dp-section-events">
      ${sectionTitle('dp-section-events', 'theme.date-picker.story.section.events')}
      ${sectionExplainer('theme.date-picker.story.section.events-explainer')}
      <div class="dp-story__events">
        <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.date-picker.story.sample.events-log-label')}</p>
        <ol id="${eventsLogId}" class="dp-story__log" aria-live="polite"></ol>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/DatePicker" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="dp-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="dp-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.dp-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.dp-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.dp-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.dp-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.dp-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: flex-start; }
.dp-story__row--wide { flex-direction: column; max-inline-size: 320px; }
.dp-story__row .theme-date-picker { inline-size: 240px; }
.dp-story__events { display: grid; gap: var(--spacing-2); }
.dp-story__log { list-style: none; padding: var(--spacing-3); margin: 0; background: var(--color-bg-base); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle); max-block-size: 200px; overflow-y: auto; font-family: var(--font-mono); font-size: var(--font-size-xs); }
.dp-story__log:empty::before { content: 'No events yet.'; color: var(--color-text-tertiary); font-family: var(--font-sans); }
.dp-story__log li { padding-block: var(--spacing-1); border-block-end: 1px dashed var(--color-border-subtle); }
.dp-story__log li:last-child { border-block-end: 0; }
.dp-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
