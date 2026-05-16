<!--
  Overview — the catalog's landing page.

  A single, doc-only story (group "Overview", pinned first in the sidebar).
  Pure HTML injected via v-html, styled with the kit's design tokens so the
  welcome screen is itself a demo of Cremona's foundations. No component
  logic, no variants — just an entry point that explains how to read the
  rest of the catalog.
-->
<script setup>
const RINGS = [
  {
    n: 1,
    name: 'Primitives',
    count: 33,
    desc: 'Single-purpose building blocks — Button, Badge, Input, Card, Avatar… No dependencies on other components.',
  },
  {
    n: 2,
    name: 'Compounds',
    count: 34,
    desc: 'Components assembled from primitives — Calendar, Data Table, Combobox, Carousel… Often controller-driven.',
  },
  {
    n: 3,
    name: 'Patterns',
    count: 57,
    desc: 'Full page-level patterns — Auth flows, Error pages, Navigation shells, Onboarding, RGPD, Search…',
  },
];

const FACTS = [
  ['124', 'components'],
  ['58', 'Stimulus controllers'],
  ['oklch', 'token-first theming'],
  ['axe', 'a11y-tested'],
  ['RTL', 'LTR + RTL ready'],
  ['dark', 'light + dark mode'],
];

const ringCard = ({ n, name, count, desc }) => `
  <article class="ov-ring">
    <header class="ov-ring__head">
      <span class="ov-ring__badge">Ring ${n}</span>
      <span class="ov-ring__count">${count}</span>
    </header>
    <h3 class="ov-ring__name">${name}</h3>
    <p class="ov-ring__desc">${desc}</p>
  </article>`;

const factCell = ([value, label]) => `
  <div class="ov-fact">
    <strong class="ov-fact__value">${value}</strong>
    <span class="ov-fact__label">${label}</span>
  </div>`;

const bodyHtml = `
  <main class="ov">
    <header class="ov__hero">
      <p class="ov__eyebrow">UI kit</p>
      <h1 class="ov__title">Cremona</h1>
      <p class="ov__tagline">
        Universal tokenized UI kit — Tailwind&nbsp;v4 · Stimulus · Twig.
        Symfony-first, portable to React / Vue / Drupal / static.
      </p>
    </header>

    <section class="ov__section" aria-labelledby="ov-rings">
      <h2 id="ov-rings" class="ov__h2">The ring methodology</h2>
      <p class="ov__lead">
        Components are organised in concentric rings — inner rings never
        depend on outer ones. Browse them in the sidebar groups below.
      </p>
      <div class="ov__rings">
        ${RINGS.map(ringCard).join('')}
      </div>
    </section>

    <section class="ov__section" aria-labelledby="ov-read">
      <h2 id="ov-read" class="ov__h2">Reading a story</h2>
      <p class="ov__lead">
        Every component story ships four viewport variants so you can check
        each component against the full theming matrix at a glance:
      </p>
      <ul class="ov__variants">
        <li><strong>Light · LTR</strong> — default</li>
        <li><strong>Light · RTL</strong> — right-to-left mirroring</li>
        <li><strong>Dark · LTR</strong> — dark mode</li>
        <li><strong>Dark · RTL</strong> — dark mode, mirrored</li>
      </ul>
    </section>

    <section class="ov__section" aria-labelledby="ov-facts">
      <h2 id="ov-facts" class="ov__h2">At a glance</h2>
      <div class="ov__facts">
        ${FACTS.map(factCell).join('')}
      </div>
    </section>
  </main>
`;
</script>

<template>
  <Story title="Welcome" group="Overview" :layout="{ type: 'single' }">
    <Variant title="Welcome">
      <div v-html="bodyHtml"></div>
    </Variant>
  </Story>
</template>

<style>
.ov {
  display: grid;
  gap: var(--spacing-10);
  max-inline-size: 64rem;
  margin-inline: auto;
  padding: var(--spacing-10) var(--spacing-6);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  min-block-size: 100vh;
}

.ov__hero {
  display: grid;
  gap: var(--spacing-3);
}
.ov__eyebrow {
  font: var(--typography-overline);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  margin: 0;
}
.ov__title {
  font: var(--typography-h1);
  font-size: clamp(2.5rem, 6vw, 4rem);
  line-height: 1.05;
  margin: 0;
}
.ov__tagline {
  font: var(--typography-body);
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  max-inline-size: 44rem;
  margin: 0;
}

.ov__section {
  display: grid;
  gap: var(--spacing-4);
}
.ov__h2 {
  font: var(--typography-h3);
  margin: 0;
}
.ov__lead {
  font: var(--typography-body);
  color: var(--color-text-secondary);
  max-inline-size: 44rem;
  margin: 0;
}

.ov__rings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: var(--spacing-4);
}
.ov-ring {
  display: grid;
  gap: var(--spacing-2);
  padding: var(--spacing-5);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}
.ov-ring__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ov-ring__badge {
  font: var(--typography-caption);
  font-weight: 600;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  color: var(--color-text-on-accent, #fff);
  background: var(--color-accent-default);
}
.ov-ring__count {
  font: var(--typography-h3);
  color: var(--color-text-tertiary);
}
.ov-ring__name {
  font: var(--typography-h4);
  margin: 0;
}
.ov-ring__desc {
  font: var(--typography-caption);
  color: var(--color-text-secondary);
  margin: 0;
}

.ov__variants {
  display: grid;
  gap: var(--spacing-2);
  margin: 0;
  padding-inline-start: var(--spacing-5);
  font: var(--typography-body);
  color: var(--color-text-secondary);
}

.ov__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--spacing-3);
}
.ov-fact {
  display: grid;
  gap: var(--spacing-1);
  padding: var(--spacing-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  text-align: center;
}
.ov-fact__value {
  font: var(--typography-h3);
  color: var(--color-text-primary);
}
.ov-fact__label {
  font: var(--typography-caption);
  color: var(--color-text-tertiary);
}
</style>
