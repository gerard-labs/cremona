/**
 * chatbot controller — Chatbot (Ring 3 S3.3c, 54e Ring 3 pattern — FINAL Ring 3).
 *
 * 19th Ring 3 controller (after preferences-center S3.3b-2).
 *
 * Thin controller (~85-110 effective lines) — pure composition of Drawer
 * Ring 2 + Input Ring 1 + Item Ring 1. Manages :
 *   - Message append (user / bot / system roles) into the messages list.
 *   - Auto-scroll to bottom on new message (respects prefers-reduced-motion).
 *   - Send action : reads input value + dispatches chatbot:send + clears input.
 *   - Typing indicator toggle via setTyping(flag) public method.
 *
 * NO lib loaded — consumer provides messages content (plain text safely
 * escaped, OR pre-rendered HTML). marked / streaming markdown rendering
 * deferred to Ring 4+ trigger per ADR-0033 §"Trade-offs deferred to Ring 4+"
 * when first consumer Chatbot ships LLM-generated markdown content.
 *
 * 13th cross-controller compose instance : data-controller="drawer chatbot".
 *
 * Surface :
 *   data-controller="drawer chatbot"
 *
 *   data-chatbot-target="messages"           (ol.theme-chatbot__messages — append target)
 *   data-chatbot-target="messageTemplate"    (li.theme-chatbot__message — template clone source)
 *   data-chatbot-target="input"              (input — send-on-submit / clear-on-send)
 *   data-chatbot-target="typing"             (typing indicator, [data-active])
 *
 *   data-action="submit->chatbot#send"       (on the form ; reads input + dispatches event)
 *
 *   Events (bubbles + composed) :
 *     chatbot:send              (detail.{ text, sentAt }) — consumer wires actual API call
 *     chatbot:message-appended  (detail.{ role, text, appendedAt })
 *     chatbot:typing-changed    (detail.{ active })
 *
 *   Public methods (consumer calls programmatically) :
 *     appendMessage(role, text) — adds a new <li> message bubble (role: 'user'/'bot'/'system')
 *     setTyping(active)         — toggles typing indicator
 *     clearMessages()           — empties the messages list (preserves greeting if pre-seeded)
 */

import { Controller } from '@hotwired/stimulus';

export default class ChatbotController extends Controller {
  static targets = ['messages', 'input', 'typing'];

  // Class-field initial-fire guard.
  _destroyed = false;

  connect() {
    this._destroyed = false;
    // Auto-scroll to bottom on connect (in case greeting / pre-seeded messages exist).
    this._scrollToBottom();
  }

  disconnect() {
    this._destroyed = true;
  }

  /**
   * Wired via `data-action="submit->chatbot#send"` on the form. Reads
   * input value + dispatches chatbot:send + clears input. Does NOT
   * append the user message to the list — consumer decides when to
   * call appendMessage('user', text) (optimistic vs after server ACK).
   */
  send(event) {
    if (this._destroyed) return;
    if (event) event.preventDefault();
    if (!this.hasInputTarget) return;
    const text = this.inputTarget.value.trim();
    if (text.length === 0) return;
    this.inputTarget.value = '';
    this.element.dispatchEvent(
      new CustomEvent('chatbot:send', {
        bubbles: true,
        composed: true,
        detail: { text, sentAt: new Date().toISOString() },
      }),
    );
  }

  /**
   * Public — append a message bubble to the conversation list. Role
   * controls visual alignment + token : 'user' (right + primary bg) /
   * 'bot' (left + elevated bg) / 'system' (centered + sunken bg).
   */
  appendMessage(role, text) {
    if (this._destroyed) return;
    if (!this.hasMessagesTarget) return;
    const validRole = ['user', 'bot', 'system'].includes(role) ? role : 'bot';
    const li = document.createElement('li');
    li.className = 'theme-chatbot__message';
    li.setAttribute('data-role', validRole);
    const item = document.createElement('div');
    item.className = 'theme-item';
    const textWrap = document.createElement('div');
    textWrap.className = 'theme-item__text';
    const label = document.createElement('span');
    label.className = 'theme-item__label';
    label.textContent = String(text);
    textWrap.appendChild(label);
    item.appendChild(textWrap);
    li.appendChild(item);
    this.messagesTarget.appendChild(li);
    this._scrollToBottom();
    this.element.dispatchEvent(
      new CustomEvent('chatbot:message-appended', {
        bubbles: true,
        composed: true,
        detail: { role: validRole, text: String(text), appendedAt: new Date().toISOString() },
      }),
    );
  }

  /** Public — toggle typing indicator visibility. */
  setTyping(active) {
    if (this._destroyed) return;
    if (!this.hasTypingTarget) return;
    const flag = active ? 'true' : 'false';
    this.typingTarget.setAttribute('data-active', flag);
    this.typingTarget.setAttribute('aria-hidden', active ? 'false' : 'true');
    this.element.dispatchEvent(
      new CustomEvent('chatbot:typing-changed', {
        bubbles: true,
        composed: true,
        detail: { active: !!active },
      }),
    );
  }

  /** Public — clear all messages (does NOT auto-restore greeting). */
  clearMessages() {
    if (this._destroyed) return;
    if (!this.hasMessagesTarget) return;
    this.messagesTarget.innerHTML = '';
  }

  /**
   * Internal — scroll messages list to bottom. Honors prefers-reduced-motion
   * by using behavior 'auto' (instant) vs 'smooth' (animated).
   */
  _scrollToBottom() {
    if (!this.hasMessagesTarget) return;
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.messagesTarget.scrollTo({
      top: this.messagesTarget.scrollHeight,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }
}
