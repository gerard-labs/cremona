<!--
  InputGroup story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (8): default · text-affix · icon-affix · button-affix · both-sides
  · states · sizes.

  Stimulus is booted via onMounted(boot) so the `input-group` controller
  connects on mount. The button-affix section wires click→input-group#clear
  to demonstrate the interactive clear pattern; visual baselines bake the
  at-rest state (post-mount, pre-click).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

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

function renderIcon(name, size = 'sm') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] ?? ''}</span>`;
}

function renderInput(props = {}) {
  const {
    type = 'text', name, htmlId, value, placeholder, size = 'md',
    disabled, invalid, required, inputmode, autocomplete,
  } = props;
  const attrs = [
    `class="cremona-input"`,
    `type="${type}"`,
    `data-size="${size}"`,
    name ? `name="${name}"` : '',
    htmlId ? `id="${htmlId}"` : '',
    value != null ? `value="${value}"` : '',
    placeholder ? `placeholder="${placeholder}"` : '',
    disabled ? 'disabled' : '',
    invalid ? 'aria-invalid="true"' : '',
    required ? 'required aria-required="true"' : '',
    inputmode ? `inputmode="${inputmode}"` : '',
    autocomplete ? `autocomplete="${autocomplete}"` : '',
  ].filter(Boolean).join(' ');
  return `<input ${attrs}>`;
}

function renderGroup({ prefix, prefixIcon, suffix, suffixIcon, suffixButton, size = 'md', disabled, invalid, input }) {
  const classes = ['cremona-input-group'];
  if (disabled) classes.push('cremona-input-group--disabled');
  if (invalid)  classes.push('cremona-input-group--invalid');

  const prefixHtml = (prefix || prefixIcon)
    ? `<span class="cremona-input-group__prefix" data-input-group-target="prefix">${prefixIcon ? renderIcon(prefixIcon) : ''}${prefix ? `<span>${prefix}</span>` : ''}</span>`
    : '';

  const suffixHtml = suffixButton
    ? `<span class="cremona-input-group__suffix" data-input-group-target="suffix">${suffixButton}</span>`
    : ((suffix || suffixIcon)
        ? `<span class="cremona-input-group__suffix" data-input-group-target="suffix">${suffixIcon ? renderIcon(suffixIcon) : ''}${suffix ? `<span>${suffix}</span>` : ''}</span>`
        : '');

  return `
    <div class="${classes.join(' ')}" data-size="${size}" data-controller="input-group" data-action="click->input-group#delegateClick">
      ${prefixHtml}
      ${input}
      ${suffixHtml}
    </div>
  `;
}

function row(html, label) {
  return `
    <div class="ig-story__row">
      ${label ? `<code class="ig-story__rowlabel">${label}</code>` : ''}
      <div class="ig-story__rowcontent">${html}</div>
    </div>
  `;
}

const PH = {
  amount:   t('theme.input-group.placeholder.amount'),
  password: t('theme.input-group.placeholder.password'),
  username: t('theme.input-group.placeholder.username'),
};

const clearButton = `<button type="button" data-action="click->input-group#clear" aria-label="${t('theme.input-group.aria.clear')}">${renderIcon('delete')}</button>`;

const bodyHtml = `
  <section class="ig-story" data-testid="input-group-root">
    <header class="ig-story__header">
      <h1>${t('theme.input-group.story.title')}</h1>
      <p>${t('theme.input-group.story.subtitle')}</p>
    </header>

    <section class="ig-story__section" aria-labelledby="ig-section-default">
      <h2 id="ig-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.input-group.story.section.default')}</h2>
      <div class="ig-story__stack">
        ${row(renderGroup({ prefix: 'https://', input: renderInput({ htmlId: 'demo-url',     type: 'url',  placeholder: 'monsite.fr' }) }), 'url')}
        ${row(renderGroup({ prefix: 'github.com/', input: renderInput({ htmlId: 'demo-github', placeholder: PH.username }) }),                'github')}
      </div>
    </section>

    <section class="ig-story__section" aria-labelledby="ig-section-text-affix">
      <h2 id="ig-section-text-affix" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.input-group.story.section.text-affix')}</h2>
      <div class="ig-story__stack">
        ${row(renderGroup({ suffix: 'EUR',  input: renderInput({ htmlId: 'demo-amount-eur', type: 'number', inputmode: 'decimal', placeholder: PH.amount }) }), 'currency')}
        ${row(renderGroup({ suffix: 'kg',   input: renderInput({ htmlId: 'demo-weight',     type: 'number', inputmode: 'decimal', placeholder: '0' }) }),       'unit')}
        ${row(renderGroup({ suffix: '%',    input: renderInput({ htmlId: 'demo-percent',    type: 'number', inputmode: 'decimal', placeholder: '0' }) }),       'percent')}
      </div>
    </section>

    <section class="ig-story__section" aria-labelledby="ig-section-icon-affix">
      <h2 id="ig-section-icon-affix" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.input-group.story.section.icon-affix')}</h2>
      <div class="ig-story__stack">
        ${row(renderGroup({ prefixIcon: 'search', input: renderInput({ htmlId: 'demo-search',  type: 'search', placeholder: t('theme.input.placeholder.search') }) }),    'search')}
        ${row(renderGroup({ prefixIcon: 'user',   input: renderInput({ htmlId: 'demo-user',    placeholder: PH.username }) }),                                            'user')}
      </div>
    </section>

    <section class="ig-story__section" aria-labelledby="ig-section-button-affix">
      <h2 id="ig-section-button-affix" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.input-group.story.section.button-affix')}</h2>
      <p class="ig-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.input-group.story.explainer.button')}</p>
      <div class="ig-story__stack">
        ${row(renderGroup({ suffixButton: clearButton, input: renderInput({ htmlId: 'demo-clear', value: 'préremplie pour le clear' }) }), 'clearable')}
      </div>
    </section>

    <section class="ig-story__section" aria-labelledby="ig-section-both-sides">
      <h2 id="ig-section-both-sides" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.input-group.story.section.both-sides')}</h2>
      <div class="ig-story__stack">
        ${row(renderGroup({ prefix: '€', suffix: '.00', input: renderInput({ htmlId: 'demo-both', type: 'number', inputmode: 'decimal', placeholder: PH.amount }) }), 'currency + decimals')}
        ${row(renderGroup({ prefixIcon: 'search', suffixButton: clearButton, input: renderInput({ htmlId: 'demo-search-clear', type: 'search', placeholder: t('theme.input.placeholder.search'), value: 'samurai' }) }), 'search + clear')}
      </div>
    </section>

    <section class="ig-story__section" aria-labelledby="ig-section-states">
      <h2 id="ig-section-states" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.input-group.story.section.states')}</h2>
      <div class="ig-story__stack">
        ${row(renderGroup({ prefix: 'https://', disabled: true, input: renderInput({ htmlId: 'demo-state-disabled', disabled: true, placeholder: 'monsite.fr' }) }),                 'disabled')}
        ${row(renderGroup({ suffix: 'EUR',      invalid: true,  input: renderInput({ htmlId: 'demo-state-invalid',  type: 'number', value: '-5', invalid: true, describedBy: 'demo-state-invalid-error' }) }), 'invalid')}
      </div>
      <p class="ig-story__explainer cremona-typography" data-variant="caption" data-color="tertiary" id="demo-state-invalid-error">${t('theme.input-group.story.explainer.button')}</p>
    </section>

    <section class="ig-story__section" aria-labelledby="ig-section-sizes">
      <h2 id="ig-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.input-group.story.section.sizes')}</h2>
      <div class="ig-story__stack">
        ${row(renderGroup({ prefix: '€', size: 'sm', input: renderInput({ htmlId: 'demo-size-sm', type: 'number', size: 'sm', placeholder: PH.amount }) }), 'sm')}
        ${row(renderGroup({ prefix: '€', size: 'md', input: renderInput({ htmlId: 'demo-size-md', type: 'number', size: 'md', placeholder: PH.amount }) }), 'md')}
        ${row(renderGroup({ prefix: '€', size: 'lg', input: renderInput({ htmlId: 'demo-size-lg', type: 'number', size: 'lg', placeholder: PH.amount }) }), 'lg')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Input Group" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="ig-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="ig-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.ig-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.ig-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.ig-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.ig-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.ig-story__stack { display: grid; gap: var(--spacing-3); }
.ig-story__row { display: grid; grid-template-columns: minmax(140px, 180px) 1fr; gap: var(--spacing-3); align-items: center; }
.ig-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.ig-story__rowcontent { min-inline-size: 0; }
.ig-story__explainer { max-inline-size: 70ch; }
.ig-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
