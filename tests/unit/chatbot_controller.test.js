import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import ChatbotController from '../../src/js/controllers/chatbot_controller.js';

async function tick() {
  await Promise.resolve();
}

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('chatbot', ChatbotController);
  return app;
}

const HTML = `
  <div data-controller="chatbot">
    <ol data-chatbot-target="messages"></ol>
    <div data-chatbot-target="typing" data-active="false" aria-hidden="true">
      <span></span>
    </div>
    <form data-action="submit->chatbot#send">
      <input type="text" data-chatbot-target="input" />
      <button type="submit">Send</button>
    </form>
  </div>
`;

describe('chatbot controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    }
    // happy-dom doesn't implement scrollTo on Elements ; stub it.
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    app?.stop();
  });

  it('appends a user message bubble with correct role + text', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.appendMessage('user', 'Bonjour');
    const li = root.querySelector('.theme-chatbot__message');
    expect(li).not.toBeNull();
    expect(li.getAttribute('data-role')).toBe('user');
    expect(li.textContent.trim()).toBe('Bonjour');
  });

  it('appends a bot message bubble with correct role', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.appendMessage('bot', 'Salut !');
    const li = root.querySelector('.theme-chatbot__message');
    expect(li.getAttribute('data-role')).toBe('bot');
  });

  it('coerces invalid role to bot (defensive)', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.appendMessage('hacker', 'XSS attempt');
    const li = root.querySelector('.theme-chatbot__message');
    expect(li.getAttribute('data-role')).toBe('bot');
  });

  it('dispatches chatbot:message-appended on appendMessage', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const handler = vi.fn();
    root.addEventListener('chatbot:message-appended', handler);
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.appendMessage('user', 'test');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.role).toBe('user');
    expect(handler.mock.calls[0][0].detail.text).toBe('test');
  });

  it('send action reads input + dispatches chatbot:send + clears input', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const input = root.querySelector('input');
    input.value = 'Hello world';
    const handler = vi.fn();
    root.addEventListener('chatbot:send', handler);
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.send({ preventDefault: () => {} });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.text).toBe('Hello world');
    expect(input.value).toBe('');
  });

  it('send ignores empty / whitespace-only input', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const input = root.querySelector('input');
    input.value = '   ';
    const handler = vi.fn();
    root.addEventListener('chatbot:send', handler);
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.send({ preventDefault: () => {} });
    expect(handler).not.toHaveBeenCalled();
  });

  it('setTyping(true) flips typing target data-active + dispatches event', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const typing = root.querySelector('[data-chatbot-target="typing"]');
    const handler = vi.fn();
    root.addEventListener('chatbot:typing-changed', handler);
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.setTyping(true);
    expect(typing.getAttribute('data-active')).toBe('true');
    expect(typing.getAttribute('aria-hidden')).toBe('false');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      detail: { active: true },
    }));
  });

  it('setTyping(false) restores hidden state', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.setTyping(true);
    ctrl.setTyping(false);
    const typing = root.querySelector('[data-chatbot-target="typing"]');
    expect(typing.getAttribute('data-active')).toBe('false');
    expect(typing.getAttribute('aria-hidden')).toBe('true');
  });

  it('clearMessages empties the messages list', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.appendMessage('user', 'A');
    ctrl.appendMessage('bot', 'B');
    expect(root.querySelectorAll('.theme-chatbot__message')).toHaveLength(2);
    ctrl.clearMessages();
    expect(root.querySelectorAll('.theme-chatbot__message')).toHaveLength(0);
  });

  it('auto-scrolls to bottom on append (smooth behavior by default)', async () => {
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const messages = root.querySelector('[data-chatbot-target="messages"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.appendMessage('user', 'A');
    expect(messages.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' }),
    );
  });

  it('auto-scrolls instantly under prefers-reduced-motion', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    app = mount(HTML);
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const messages = root.querySelector('[data-chatbot-target="messages"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    ctrl.appendMessage('user', 'A');
    expect(messages.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' }),
    );
  });

  it('does not throw if messages target missing (defensive)', async () => {
    app = mount('<div data-controller="chatbot"></div>');
    await tick();
    const root = document.querySelector('[data-controller="chatbot"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'chatbot');
    expect(() => ctrl.appendMessage('bot', 'x')).not.toThrow();
    expect(() => ctrl.setTyping(true)).not.toThrow();
    expect(() => ctrl.clearMessages()).not.toThrow();
  });
});
