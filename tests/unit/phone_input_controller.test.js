import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { mockIntlTelInput, mockItiInstance } = vi.hoisted(() => {
  const getNumber = vi.fn(() => '+33123456789');
  const getSelectedCountryData = vi.fn(() => ({ iso2: 'fr', dialCode: '33', name: 'France' }));
  const isValidNumber = vi.fn(() => true);
  const destroy = vi.fn();
  const itiInstance = { getNumber, getSelectedCountryData, isValidNumber, destroy };
  const factory = vi.fn(() => itiInstance);
  return { mockIntlTelInput: factory, mockItiInstance: itiInstance };
});

vi.mock('intl-tel-input', () => ({ default: mockIntlTelInput }));

const PhoneInputImport = await import('../../src/js/controllers/phone_input_controller.js');
const PhoneInputController = PhoneInputImport.default;
const { __resetIntlTelInputCache } = PhoneInputImport;

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('phone-input', PhoneInputController);
  return app;
}

function defaultMarkup({ initialCountry = 'fr', preferredCountries = ['fr', 'us', 'gb'] } = {}) {
  return `
    <div data-controller="phone-input"
         data-phone-input-initial-country-value="${initialCountry}"
         data-phone-input-preferred-countries-value='${JSON.stringify(preferredCountries)}'
         data-phone-input-separate-dial-code-value="false"
         data-phone-input-national-mode-value="true">
      <input data-phone-input-target="input" />
      <input type="hidden" data-phone-input-target="hiddenInput" />
    </div>
  `;
}

describe('phone-input controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    __resetIntlTelInputCache();
    mockIntlTelInput.mockClear();
    mockItiInstance.getNumber.mockClear();
    mockItiInstance.getSelectedCountryData.mockClear();
    mockItiInstance.isValidNumber.mockClear();
    mockItiInstance.destroy.mockClear();
  });

  afterEach(() => {
    app?.stop();
  });

  it('mounts with idle state and stamps type=tel + autocomplete + inputmode', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="phone-input"]');
    expect(root.getAttribute('data-phone-input-state')).toBe('idle');
    const input = document.querySelector('[data-phone-input-target="input"]');
    expect(input.getAttribute('type')).toBe('tel');
    expect(input.getAttribute('autocomplete')).toBe('tel');
    expect(input.getAttribute('inputmode')).toBe('tel');
  });

  it('dispatches phone-input:mount with initialCountry on connect', async () => {
    const handler = vi.fn();
    document.addEventListener('phone-input:mount', handler);
    app = mount(defaultMarkup({ initialCountry: 'us' }));
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.initialCountry).toBe('us');
    document.removeEventListener('phone-input:mount', handler);
  });

  it('does NOT lazy-load intl-tel-input on connect (waits for focus)', async () => {
    app = mount(defaultMarkup());
    await tick();
    expect(mockIntlTelInput).not.toHaveBeenCalled();
  });

  it('lazy-loads intl-tel-input on first focus event', async () => {
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-phone-input-target="input"]');
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();
    expect(mockIntlTelInput).toHaveBeenCalledTimes(1);
    const root = document.querySelector('[data-controller="phone-input"]');
    expect(root.getAttribute('data-phone-input-state')).toBe('ready');
  });

  it('dispatches phone-input:ready after intl-tel-input init', async () => {
    const handler = vi.fn();
    document.addEventListener('phone-input:ready', handler);
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-phone-input-target="input"]');
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.country).toBe('fr');
    document.removeEventListener('phone-input:ready', handler);
  });

  it('passes initialCountry + preferredCountries config to intl-tel-input factory', async () => {
    app = mount(defaultMarkup({ initialCountry: 'us', preferredCountries: ['us', 'ca', 'mx'] }));
    await tick();
    const input = document.querySelector('[data-phone-input-target="input"]');
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();
    const config = mockIntlTelInput.mock.calls[0][1];
    expect(config.initialCountry).toBe('us');
    expect(config.preferredCountries).toEqual(['us', 'ca', 'mx']);
    expect(config.nationalMode).toBe(true);
  });

  it('does NOT re-load intl-tel-input on subsequent focus (once: true listener)', async () => {
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-phone-input-target="input"]');
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();
    expect(mockIntlTelInput).toHaveBeenCalledTimes(1);

    // Subsequent focus should NOT re-invoke (listener removed via once: true).
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    expect(mockIntlTelInput).toHaveBeenCalledTimes(1);
  });

  it('syncs hidden input with E.164 number on change event', async () => {
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-phone-input-target="input"]');
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();

    const hidden = document.querySelector('[data-phone-input-target="hiddenInput"]');
    expect(hidden.value).toBe('+33123456789');
  });

  it('dispatches phone-input:change with number + country + valid on change', async () => {
    const handler = vi.fn();
    document.addEventListener('phone-input:change', handler);
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-phone-input-target="input"]');
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      number: '+33123456789',
      country: 'fr',
      valid: true,
    });
    document.removeEventListener('phone-input:change', handler);
  });

  it('dispatches phone-input:country-change on countrychange event', async () => {
    const handler = vi.fn();
    document.addEventListener('phone-input:country-change', handler);
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-phone-input-target="input"]');
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();

    input.dispatchEvent(new Event('countrychange', { bubbles: true }));
    await tick();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      iso2: 'fr',
      dialCode: '33',
      name: 'France',
    });
    document.removeEventListener('phone-input:country-change', handler);
  });

  it('skips post-disconnect focus (race-check via _destroyed flag)', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="phone-input"]');
    const input = root.querySelector('input');
    root.remove();
    await tick();
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();
    expect(mockIntlTelInput).not.toHaveBeenCalled();
  });

  it('destroys intl-tel-input instance on disconnect', async () => {
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-phone-input-target="input"]');
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    await tick();
    await tick();
    expect(mockIntlTelInput).toHaveBeenCalledTimes(1);

    const root = document.querySelector('[data-controller="phone-input"]');
    root.remove();
    await tick();
    expect(mockItiInstance.destroy).toHaveBeenCalledTimes(1);
  });
});
