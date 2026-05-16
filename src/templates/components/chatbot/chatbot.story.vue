<!--
  Chatbot story — 4 viewport variants (Light/Dark × LTR/RTL).
  Sections : default-closed · open-with-greeting · open-with-conversation · typing-indicator.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderMessage({ role = 'bot', text = '' }) {
  return `
    <li class="theme-chatbot__message" data-role="${role}">
      <div class="theme-item">
        <div class="theme-item__text">
          <span class="theme-item__label">${text}</span>
        </div>
      </div>
    </li>
  `;
}

function renderChatbot({ id = 'story-chatbot', open = true, messages = [], typing = false }) {
  const messagesHtml = messages.map(renderMessage).join('');
  const greetingFallback = messages.length === 0
    ? renderMessage({ role: 'bot', text: t('theme.chatbot.greeting') })
    : '';
  return `
    <div class="theme-drawer-wrap theme-chatbot"
         id="${id}"
         data-drawer-open-value="${open}"
         data-drawer-edge-value="end">
      <dialog class="theme-drawer theme-chatbot__dialog"
              data-edge="end"
              aria-labelledby="${id}__title"
              ${open ? 'open' : ''}>
        <header class="theme-drawer__header theme-chatbot__header">
          <h2 class="theme-drawer__title" id="${id}__title">${t('theme.chatbot.title')}</h2>
          <button type="button" class="theme-button theme-drawer__close"
                  data-variant="ghost" data-size="sm"
                  aria-label="${t('theme.chatbot.aria.close')}">
            <svg class="theme-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-x"/></svg>
          </button>
        </header>
        <div class="theme-drawer__body theme-chatbot__body">
          <ol class="theme-chatbot__messages" aria-live="polite" aria-atomic="false">
            ${greetingFallback}${messagesHtml}
          </ol>
          <div class="theme-chatbot__typing" data-active="${typing}" aria-hidden="${!typing}">
            <span class="theme-chatbot__typing-text">${t('theme.chatbot.typing')}</span>
            <span class="theme-chatbot__typing-dots" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
          </div>
        </div>
        <footer class="theme-drawer__footer theme-chatbot__footer">
          <form class="theme-chatbot__form" novalidate>
            <label for="${id}__input" class="theme-label sr-only">${t('theme.chatbot.input.label')}</label>
            <input type="text" id="${id}__input" class="theme-input theme-chatbot__input"
                   name="message" placeholder="${t('theme.chatbot.placeholder')}" autocomplete="off">
            <button type="submit" class="theme-button theme-button--primary theme-chatbot__send"
                    aria-label="${t('theme.chatbot.aria.send')}">
              <svg class="theme-icon theme-icon-bidi" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-arrow-right"/></svg>
            </button>
          </form>
        </footer>
      </dialog>
    </div>
  `;
}

const bodyHtml = `
  <section class="chatbot-story" aria-labelledby="chatbot-story-title">
    <header class="chatbot-story__header">
      <h1 id="chatbot-story-title">${t('theme.chatbot.story.title')}</h1>
      <p>${t('theme.chatbot.story.subtitle')}</p>
    </header>

    <section class="chatbot-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.chatbot.story.section.greeting')}</h2>
      <p class="chatbot-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.chatbot.story.explainer.greeting')}</p>
      <div class="chatbot-story__frame">${renderChatbot({ id: 'story-greeting', open: true, messages: [] })}</div>
    </section>

    <section class="chatbot-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.chatbot.story.section.conversation')}</h2>
      <p class="chatbot-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.chatbot.story.explainer.conversation')}</p>
      <div class="chatbot-story__frame">${renderChatbot({
        id: 'story-conversation',
        open: true,
        messages: [
          { role: 'bot', text: t('theme.chatbot.story.sample.bot-greeting') },
          { role: 'user', text: t('theme.chatbot.story.sample.user-q') },
          { role: 'bot', text: t('theme.chatbot.story.sample.bot-a') },
          { role: 'system', text: t('theme.chatbot.story.sample.system') },
        ],
      })}</div>
    </section>

    <section class="chatbot-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.chatbot.story.section.typing')}</h2>
      <p class="chatbot-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.chatbot.story.explainer.typing')}</p>
      <div class="chatbot-story__frame">${renderChatbot({
        id: 'story-typing',
        open: true,
        messages: [
          { role: 'user', text: t('theme.chatbot.story.sample.user-q') },
        ],
        typing: true,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Chatbot" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="chatbot-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="chatbot-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.chatbot-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.chatbot-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.chatbot-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.chatbot-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.chatbot-story__explainer { max-inline-size: 70ch; }
.chatbot-story__frame { position: relative; min-block-size: 480px; padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; }
.chatbot-story__frame .theme-drawer-wrap { position: absolute; inset: 0; }
.chatbot-story__frame .theme-chatbot__dialog { position: absolute; inset-block-start: 0; inset-inline-end: 0; block-size: 100%; }
.chatbot-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
