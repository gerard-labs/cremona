/**
 * format-date.js — locale-aware date formatting via Day.js.
 *
 * Day.js + relativeTime plugin + fr + en locales bundled eager.
 *
 * Initial bundle cost : ~3 kB gzip combined (Day.js core ~2 kB +
 * relativeTime plugin ~1 kB + locales fr+en ~0.5 kB combined).
 * Eager because used by Ring 3 NotificationCenter + ActivityFeed +
 * Ring 4+ Settings / HR / CRM relative-time. Lazy alternative
 * would pay the cost 5-10× across consumer-pattern controllers ;
 * eager amortizes the cost once.
 *
 * Consumers needing additional locales (de, es, ar, …) opt-in
 * via consumer-side `import 'dayjs/locale/de'` + `dayjs.locale('de')`
 * after the kit's boot — locales register with Day.js's module-
 * scoped registry.
 *
 * API surface :
 *
 *   formatRelative(date, { locale?, baseDate? })  → "il y a 3 minutes" / "in 2 hours"
 *   formatDate(date,    { locale?, format? })     → "13 mai 2026"
 *   formatTime(date,    { locale?, format? })     → "14:32"
 *
 * The kit's `t()` helper handles the *string* templating ; this
 * util handles the *date/time formatting* — they compose at the
 * consumer's pattern level.
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import 'dayjs/locale/fr.js';
import 'dayjs/locale/en.js';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);  // enables the localized L/LL/LT format tokens
dayjs.locale('fr');  // default — matches kit's canonical microcopy locale

/**
 * Set the active Day.js locale. Mirrors {@link setLocale} from i18n.js
 * for the date formatting side. Consumers boot the kit then call
 * `setDayjsLocale('en')` if their app runs in English.
 *
 * @param {string} locale
 */
export function setDayjsLocale(locale) {
  dayjs.locale(locale);
}

/** @returns {string} current Day.js locale */
export function getDayjsLocale() {
  return dayjs.locale();
}

/**
 * Format a date as a relative duration from baseDate (default = now).
 * Returns localized output : "il y a 3 minutes" / "in 2 hours".
 *
 * @param {string | number | Date | dayjs.Dayjs} date — the target date
 * @param {object} [options]
 * @param {string} [options.locale] — override the active locale just for this call
 * @param {string | number | Date | dayjs.Dayjs} [options.baseDate] — the reference date (default: now)
 * @returns {string}
 */
export function formatRelative(date, { locale, baseDate } = {}) {
  // Day.js instances are immutable — `.locale()` returns a new instance
  // rather than mutating in place, so its result must be reassigned.
  let d = dayjs(date);
  if (locale) d = d.locale(locale);
  return d.from(baseDate ? dayjs(baseDate) : dayjs());
}

/**
 * Format a date as a localized absolute date.
 *
 * Default format `'LL'` resolves to a localized long date :
 *   - fr: "13 mai 2026"
 *   - en: "May 13, 2026"
 *
 * Day.js format reference: {@link https://day.js.org/docs/en/display/format}.
 *
 * @param {string | number | Date | dayjs.Dayjs} date
 * @param {object} [options]
 * @param {string} [options.locale]
 * @param {string} [options.format] — Day.js format token (default 'LL')
 * @returns {string}
 */
export function formatDate(date, { locale, format = 'LL' } = {}) {
  let d = dayjs(date);
  if (locale) d = d.locale(locale);
  return d.format(format);
}

/**
 * Format a date as a localized time-only string.
 *
 * Default format `'HH:mm'` resolves to 24-hour clock without seconds.
 *
 * @param {string | number | Date | dayjs.Dayjs} date
 * @param {object} [options]
 * @param {string} [options.locale]
 * @param {string} [options.format] — Day.js format token (default 'HH:mm')
 * @returns {string}
 */
export function formatTime(date, { locale, format = 'HH:mm' } = {}) {
  let d = dayjs(date);
  if (locale) d = d.locale(locale);
  return d.format(format);
}

/**
 * Format a date as a contextual short form for activity feeds :
 *
 *   - within last 24h → relative ("il y a 12 minutes")
 *   - yesterday → "hier à 14:32"
 *   - within last 7 days → "lundi à 14:32"
 *   - older → absolute ("13 mai 2026")
 *
 * Matches microcopy-tone guidance for "Dates & heures".
 *
 * @param {string | number | Date | dayjs.Dayjs} date
 * @param {object} [options]
 * @param {string} [options.locale]
 * @param {string | number | Date | dayjs.Dayjs} [options.baseDate]
 * @returns {string}
 */
export function formatContextual(date, { locale, baseDate } = {}) {
  let d = dayjs(date);
  let base = baseDate ? dayjs(baseDate) : dayjs();
  if (locale) {
    d = d.locale(locale);
    base = base.locale(locale);
  }
  const diffHours = base.diff(d, 'hour');
  const diffDays = base.diff(d, 'day');
  if (diffHours < 24 && diffDays === 0) {
    return d.from(base);  // "il y a 12 minutes"
  }
  if (diffDays === 1) {
    // Day.js doesn't expose a single token for "hier à HH:mm" — compose
    return d.calendar
      ? d.calendar(base)
      : `${d.format('dddd')} ${d.format('HH:mm')}`;
  }
  if (diffDays < 7) {
    return `${d.format('dddd')} ${d.format('HH:mm')}`;  // "lundi 14:32"
  }
  return d.format('LL');  // "13 mai 2026"
}
