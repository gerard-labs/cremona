import { describe, it, expect, beforeEach } from 'vitest';
import { __reset, setTranslations, setLocale, getLocale, t, setDirection, getDirection } from '../../src/js/utils/i18n.js';

describe('theme/js/utils/i18n.js', () => {
  beforeEach(() => {
    __reset();
    setTranslations('fr', {
      'theme.common.actions.save': 'Enregistrer',
      'theme.greet': 'Bonjour {name}',
      'theme.items.one': '{count} élément',
      'theme.items.other': '{count} éléments',
    });
    setTranslations('en', {
      'theme.common.actions.save': 'Save',
      'theme.greet': 'Hello {name}',
      'theme.items.one': '{count} item',
      'theme.items.other': '{count} items',
    });
  });

  it('returns the FR string by default', () => {
    expect(t('theme.common.actions.save')).toBe('Enregistrer');
    expect(getLocale()).toBe('fr');
  });

  it('switches locale and resolves accordingly', () => {
    setLocale('en');
    expect(t('theme.common.actions.save')).toBe('Save');
  });

  it('interpolates {name}', () => {
    expect(t('theme.greet', { name: 'Sedie' })).toBe('Bonjour Sedie');
  });

  it('resolves plural categories via Intl.PluralRules', () => {
    expect(t('theme.items', { count: 1 })).toBe('1 élément');
    expect(t('theme.items', { count: 7 })).toBe('7 éléments');
  });

  it('falls back to the key when no translation exists', () => {
    expect(t('theme.missing.key')).toBe('theme.missing.key');
  });

  it('setDirection writes to <html dir>', () => {
    setDirection('rtl');
    expect(getDirection()).toBe('rtl');
    setDirection('ltr');
    expect(getDirection()).toBe('ltr');
  });
});
