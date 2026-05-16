<!--
  Switch story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (7): default · states · sizes · row vs bare · with-description
  · long-label · in-field.

  Zero Stimulus controller — the native <input type="checkbox" role="switch">
  is keyboard-complete (Space toggles, Tab moves). No `onMounted(boot)` needed.

  Animation: --motion-duration-base (180 ms) + --motion-easing-standard on
  both the thumb slide AND the track bg-color crossfade. Visual baselines
  capture the AT-REST state (checked / unchecked) — the in-flight animation
  is not part of the snapshot.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderSwitch(props = {}) {
  const {
    name, htmlId, value, checked, label, description, size = 'sm',
    required, disabled, invalid, describedBy, ariaLabel, className,
  } = props;

  const rootClass = label ? 'theme-switch-row' : 'theme-switch-wrap';
  const stateClasses = [];
  if (disabled) stateClasses.push('theme-switch-row--disabled');
  if (invalid) stateClasses.push('theme-switch-row--invalid');
  if (className) stateClasses.push(className);
  const rootClasses = [rootClass, ...stateClasses].join(' ');
  const tag = label ? 'label' : 'span';

  const inputAttrs = [
    `type="checkbox"`,
    `role="switch"`,
    `class="theme-switch__input"`,
    htmlId ? `id="${htmlId}"` : '',
    name ? `name="${name}"` : '',
    value != null ? `value="${value}"` : '',
    checked ? `checked` : '',
    required ? `required aria-required="true"` : '',
    disabled ? `disabled` : '',
    invalid ? `aria-invalid="true"` : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
  ].filter(Boolean).join(' ');

  const knob = `
    <span class="theme-switch" data-size="${size}">
      <input ${inputAttrs}>
      <span class="theme-switch__track" aria-hidden="true">
        <span class="theme-switch__thumb"></span>
      </span>
    </span>`;

  if (!label) {
    return `<${tag} class="${rootClasses}" data-size="${size}"${disabled ? ' data-state="disabled"' : ''}>${knob}</${tag}>`;
  }

  const labelInner = `
    <span class="theme-switch-row__text">
      <span class="theme-switch-row__label">${label}</span>
      ${required ? '<span class="theme-switch-row__required" aria-hidden="true">*</span>' : ''}
      ${description ? `<span class="theme-switch-row__description">${description}</span>` : ''}
    </span>`;

  return `<${tag} class="${rootClasses}" data-size="${size}"${disabled ? ' data-state="disabled"' : ''}>${knob}${labelInner}</${tag}>`;
}

function row(html, label) {
  return `
    <div class="switch-story__row">
      ${label ? `<code class="switch-story__rowlabel">${label}</code>` : ''}
      <div class="switch-story__rowcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  notifications: t('theme.switch.sample.notifications'),
  darkMode:      t('theme.switch.sample.dark-mode'),
  betaFeatures:  t('theme.switch.sample.beta-features'),
  twoFactor:     t('theme.switch.sample.two-factor'),
  publicProfile: t('theme.switch.sample.public-profile'),
  longLabel:     t('theme.switch.sample.long-label'),
};

const DESCS = {
  notifications: t('theme.switch.description.notifications'),
  betaFeatures:  t('theme.switch.description.beta-features'),
  twoFactor:     t('theme.switch.description.two-factor'),
};

const ARIA = {
  syncEnabled:   t('theme.switch.aria.sync-enabled'),
};

const bodyHtml = `
  <section class="switch-story" data-testid="switch-root">
    <header class="switch-story__header">
      <h1>${t('theme.switch.story.title')}</h1>
      <p>${t('theme.switch.story.subtitle')}</p>
    </header>

    <section class="switch-story__section" aria-labelledby="switch-section-default">
      <h2 id="switch-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.switch.story.section.default')}</h2>
      <div class="switch-story__stack">
        ${row(renderSwitch({ htmlId: 'demo-default-notif', label: SAMPLES.notifications, checked: true }), 'on')}
        ${row(renderSwitch({ htmlId: 'demo-default-dark',  label: SAMPLES.darkMode }),                     'off')}
      </div>
    </section>

    <section class="switch-story__section" aria-labelledby="switch-section-states">
      <h2 id="switch-section-states" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.switch.story.section.states')}</h2>
      <div class="switch-story__stack">
        ${row(renderSwitch({ htmlId: 'demo-state-off',      label: SAMPLES.darkMode }),                              'off')}
        ${row(renderSwitch({ htmlId: 'demo-state-on',       label: SAMPLES.darkMode, checked: true }),               'on')}
        ${row(renderSwitch({ htmlId: 'demo-state-dis-off',  label: SAMPLES.darkMode, disabled: true }),              'disabled off')}
        ${row(renderSwitch({ htmlId: 'demo-state-dis-on',   label: SAMPLES.darkMode, disabled: true, checked: true }), 'disabled on')}
        ${row(renderSwitch({ htmlId: 'demo-state-required', label: SAMPLES.twoFactor, required: true }),              'required')}
        ${row(renderSwitch({ htmlId: 'demo-state-invalid',  label: SAMPLES.twoFactor, required: true, invalid: true, describedBy: 'demo-state-invalid-error' }), 'invalid + required')}
      </div>
      <p class="switch-story__explainer theme-typography" data-variant="caption" data-color="tertiary" id="demo-state-invalid-error">${t('theme.switch.story.explainer.invalid')}</p>
    </section>

    <section class="switch-story__section" aria-labelledby="switch-section-sizes">
      <h2 id="switch-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.switch.story.section.sizes')}</h2>
      <div class="switch-story__stack">
        ${row(renderSwitch({ htmlId: 'demo-size-sm-off', label: SAMPLES.notifications, size: 'sm' }),                'sm (32 × 18 track, 14 px thumb)')}
        ${row(renderSwitch({ htmlId: 'demo-size-sm-on',  label: SAMPLES.notifications, size: 'sm', checked: true }), 'sm on')}
        ${row(renderSwitch({ htmlId: 'demo-size-md-off', label: SAMPLES.notifications, size: 'md' }),                'md (44 × 24 track, 20 px thumb)')}
        ${row(renderSwitch({ htmlId: 'demo-size-md-on',  label: SAMPLES.notifications, size: 'md', checked: true }), 'md on')}
      </div>
    </section>

    <section class="switch-story__section" aria-labelledby="switch-section-row-vs-bare">
      <h2 id="switch-section-row-vs-bare" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.switch.story.section.row-vs-bare')}</h2>
      <p class="switch-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.switch.story.explainer.bare')}</p>
      <div class="switch-story__stack">
        ${row(renderSwitch({ htmlId: 'demo-row',  label: SAMPLES.publicProfile, checked: true }), 'row mode (label inline)')}
        ${row(renderSwitch({ htmlId: 'demo-bare', ariaLabel: ARIA.syncEnabled }),                  'bare (aria-label only)')}
        ${row(renderSwitch({ htmlId: 'demo-bare-on', ariaLabel: ARIA.syncEnabled, checked: true }), 'bare on')}
      </div>
    </section>

    <section class="switch-story__section" aria-labelledby="switch-section-description">
      <h2 id="switch-section-description" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.switch.story.section.description')}</h2>
      <div class="switch-story__stack">
        ${row(renderSwitch({ htmlId: 'demo-desc-notif', label: SAMPLES.notifications, description: DESCS.notifications, checked: true }), 'notifications (on)')}
        ${row(renderSwitch({ htmlId: 'demo-desc-beta',  label: SAMPLES.betaFeatures,  description: DESCS.betaFeatures }),                  'beta (off)')}
        ${row(renderSwitch({ htmlId: 'demo-desc-2fa',   label: SAMPLES.twoFactor,     description: DESCS.twoFactor, required: true }),     '2FA (required)')}
      </div>
    </section>

    <section class="switch-story__section" aria-labelledby="switch-section-long-label">
      <h2 id="switch-section-long-label" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.switch.story.section.long-label')}</h2>
      <div class="switch-story__stack">
        ${row(renderSwitch({ htmlId: 'demo-long', label: SAMPLES.longLabel, checked: true }), '+30 % FR expansion')}
      </div>
    </section>

    <section class="switch-story__section" aria-labelledby="switch-section-in-field">
      <h2 id="switch-section-in-field" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.switch.story.section.in-field')}</h2>
      <div class="switch-story__stack">
        <div class="theme-field">
          <label class="theme-label" data-size="sm" for="demo-field-marketing">
            <span class="theme-label__text">${t('theme.switch.field.label.marketing')}</span>
          </label>
          ${renderSwitch({ htmlId: 'demo-field-marketing', ariaLabel: t('theme.switch.field.label.marketing'), describedBy: 'demo-field-marketing-help' })}
          <p id="demo-field-marketing-help" class="theme-field__help">${t('theme.switch.field.help.marketing')}</p>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Switch" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="switch-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="switch-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.switch-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.switch-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.switch-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.switch-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.switch-story__stack { display: grid; gap: var(--spacing-3); }
.switch-story__row { display: grid; grid-template-columns: minmax(180px, 220px) 1fr; gap: var(--spacing-3); align-items: start; }
.switch-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); padding-block-start: var(--spacing-1); }
.switch-story__rowcontent { min-inline-size: 0; }
.switch-story__explainer { max-inline-size: 70ch; }
.switch-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
