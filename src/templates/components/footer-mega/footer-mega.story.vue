<!--
  Footer-Mega story — 4 viewport variants.
  Sections : default-4col · with-aside-newsletter · with-social.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderColumn({ heading, items }) {
  return `
    <section class="cremona-footer-mega__column">
      <h3 class="cremona-typography cremona-footer-mega__column-heading" data-variant="overline">${heading}</h3>
      <ul class="cremona-footer-mega__column-items">
        ${items.map(item => `<li><a href="${item.href}" class="cremona-footer-mega__item">${item.label}</a></li>`).join('')}
      </ul>
    </section>
  `;
}

function renderFooterMega({ id = 'story-footer-mega', columns, aside = null, social = [], legal = [], copyright = '' }) {
  return `
    <footer class="cremona-footer-mega" id="${id}" aria-label="${t('theme.nav.footer.aria.label')}">
      <div class="cremona-footer-mega__top">
        <div class="cremona-footer-mega__columns">${columns.map(renderColumn).join('')}</div>
        ${aside ? `
          <aside class="cremona-footer-mega__aside" aria-labelledby="${id}-aside">
            <h3 id="${id}-aside" class="cremona-typography" data-variant="h3">${aside.heading}</h3>
            <p class="cremona-footer-mega__aside-body">${aside.body}</p>
            ${social.length ? `
              <ul class="cremona-footer-mega__social">
                ${social.map(s => `<li><a href="${s.href}" class="cremona-footer-mega__social-link" aria-label="${s.label}">${s.icon}</a></li>`).join('')}
              </ul>
            ` : ''}
          </aside>
        ` : ''}
      </div>
      ${legal.length || copyright ? `
        <div class="cremona-footer-mega__bottom">
          ${legal.length ? `
            <ul class="cremona-footer-mega__legal">
              ${legal.map(l => `<li><a href="${l.href}" class="cremona-footer-mega__legal-link">${l.label}</a></li>`).join('')}
            </ul>
          ` : ''}
          ${copyright ? `<p class="cremona-footer-mega__copyright">${copyright}</p>` : ''}
        </div>
      ` : ''}
    </footer>
  `;
}

const columns = [
  { heading: t('theme.nav.footer.column.heading.product'), items: [
    { href: '/features', label: t('theme.nav.footer.item.features') },
    { href: '/pricing', label: t('theme.nav.footer.item.pricing') },
    { href: '/changelog', label: t('theme.nav.footer.item.changelog') },
  ]},
  { heading: t('theme.nav.footer.column.heading.company'), items: [
    { href: '/about', label: t('theme.nav.footer.item.about') },
    { href: '/blog', label: t('theme.nav.footer.item.blog') },
    { href: '/careers', label: t('theme.nav.footer.item.careers') },
  ]},
  { heading: t('theme.nav.footer.column.heading.resources'), items: [
    { href: '/docs', label: t('theme.nav.footer.item.docs') },
    { href: '/help', label: t('theme.nav.footer.item.help') },
    { href: '/api', label: t('theme.nav.footer.item.api') },
  ]},
  { heading: t('theme.nav.footer.column.heading.legal'), items: [
    { href: '/terms', label: t('theme.nav.footer.item.terms') },
    { href: '/privacy', label: t('theme.nav.footer.item.privacy') },
    { href: '/security', label: t('theme.nav.footer.item.security') },
  ]},
];

const legal = [
  { href: '/terms', label: t('theme.nav.footer.legal.terms') },
  { href: '/privacy', label: t('theme.nav.footer.legal.privacy') },
  { href: '/cookies', label: t('theme.nav.footer.legal.cookies') },
];

// Inline brand SVGs — consumer-driven raw SVG (consumer provides icons via |raw).
const social = [
  { href: 'https://twitter.com/example', label: 'Twitter', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>` },
  { href: 'https://github.com/example', label: 'GitHub', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>` },
];

const bodyHtml = `
  <section class="footer-mega-story" aria-labelledby="footer-mega-story-title">
    <header class="footer-mega-story__header">
      <h1 id="footer-mega-story-title">${t('theme.nav.footer.story.title')}</h1>
      <p>${t('theme.nav.footer.story.subtitle')}</p>
    </header>

    <section class="footer-mega-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.footer.story.section.default')}</h2>
      <div class="footer-mega-story__frame">${renderFooterMega({ id: 'story-default', columns, legal, copyright: '© 2026 Acme Inc.' })}</div>
    </section>

    <section class="footer-mega-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.footer.story.section.with-aside')}</h2>
      <div class="footer-mega-story__frame">${renderFooterMega({
        id: 'story-aside',
        columns,
        aside: { heading: t('theme.nav.footer.aside.heading'), body: t('theme.nav.footer.aside.body') },
        social,
        legal,
        copyright: '© 2026 Acme Inc.',
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Footer/Mega" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="footer-mega-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="footer-mega-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.footer-mega-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.footer-mega-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.footer-mega-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.footer-mega-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.footer-mega-story__frame { border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; }
.footer-mega-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
