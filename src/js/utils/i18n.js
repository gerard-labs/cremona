/**
 * i18n.js — minimal translation runtime.
 *
 * - Flat `theme.<area>.<key>` namespaced JSON, one file per locale.
 * - Plural categories resolved via Intl.PluralRules (CLDR).
 * - Variable interpolation via `{name}` placeholders.
 * - Default locale FR, fallback FR (matches the canonical microcopy).
 *
 * Symfony consumers can ignore this util entirely and let the Symfony
 * Translator resolve the same JSON keys server-side via the (future)
 * ThemeBundle bridge.
 */

let _translations = Object.create(null);
let _locale = 'fr';
let _fallback = 'fr';

/**
 * Inject a locale's translation map. The kit ships `fr.json` + `en.json`
 * as ESM JSON imports for Vite/Histoire; consumers can also call
 * `setTranslations('de', deJson)` at runtime.
 *
 * @param {string} locale
 * @param {Record<string, string>} dict
 */
export function setTranslations(locale, dict) {
  _translations[locale] = dict;
}

/**
 * Set the active locale + reflect on `<html lang>`.
 * @param {string} locale
 */
export function setLocale(locale) {
  if (!_translations[locale]) {
    throw new Error(`[theme/i18n] Locale "${locale}" not loaded. Call setTranslations() first.`);
  }
  _locale = locale;
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

/** @returns {string} */
export function getLocale() {
  return _locale;
}

/**
 * Set the document direction. RTL is a single attribute flip — every
 * direction-sensitive CSS in the kit uses logical properties.
 * @param {'ltr' | 'rtl' | 'auto'} dir
 */
export function setDirection(dir) {
  if (typeof document !== 'undefined') document.documentElement.dir = dir;
}

/** @returns {'ltr' | 'rtl' | 'auto'} */
export function getDirection() {
  if (typeof document === 'undefined') return 'ltr';
  return /** @type {'ltr' | 'rtl' | 'auto'} */ (document.documentElement.dir || 'ltr');
}

/**
 * Translate a key with optional params.
 * - If `params.count` is present, the function appends `.<plural-category>`
 *   to the key (resolved via Intl.PluralRules), falling back to `.other`.
 * - `{name}` placeholders in the resolved string are interpolated.
 *
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  let actualKey = key;
  if ('count' in params) {
    const cat = pluralCategory(_locale, Number(params.count));
    if (lookup(_locale, `${key}.${cat}`) != null) {
      actualKey = `${key}.${cat}`;
    } else if (lookup(_locale, `${key}.other`) != null) {
      actualKey = `${key}.other`;
    }
  }
  const str = lookup(_locale, actualKey) ?? lookup(_fallback, actualKey) ?? actualKey;
  return interpolate(str, params);
}

function lookup(locale, key) {
  const dict = _translations[locale];
  return dict ? dict[key] : undefined;
}

function pluralCategory(locale, count) {
  try {
    return new Intl.PluralRules(locale).select(count);
  } catch {
    return 'other';
  }
}

function interpolate(str, params) {
  return String(str).replace(/\{(\w+)\}/g, (_, name) =>
    params[name] != null ? String(params[name]) : '',
  );
}

/** Reset internal state — for tests. */
export function __reset() {
  _translations = Object.create(null);
  _locale = 'fr';
  _fallback = 'fr';
}
