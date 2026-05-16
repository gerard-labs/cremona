/**
 * address-autocomplete controller — debounced async address autocomplete (sibling Form pattern).
 *
 * 6th Ring 3 controller (after password-strength + session-timeout-countdown + back-to-top +
 * product-tour + form-with-steps).
 *
 * Per the Forms family doctrine (cf. Form-WithSteps.md §1) :
 *  - Consumer-driven address API — kit doesn't lock the address provider. Consumer
 *    provides the fetch endpoint via `consumerEndpoint` Stimulus value (mirror
 *    SocialButtons consumer-driven brand SVG doctrine S3.1b).
 *  - Cross-controller compose with Popover Ring 2 — `data-controller="popover address-autocomplete"`
 *    on the wrapper. Popover handles positioning (Floating UI lazy per ADR-0011) ;
 *    address-autocomplete owns the fetch + suggestion list rendering.
 *  - Debounced on input (default 250 ms) to avoid hammering the consumer's API.
 *  - Race-check `_destroyed` flag prevents post-disconnect stamp.
 *
 * The kit's controller takes a `fetchFn` consumer-provided function via the
 * `consumerEndpoint` Stimulus value (URL) ; the controller appends `?q=<query>` and
 * `fetch()`-es. Consumer customization (Google Places vs Nominatim vs Mapbox) is
 * via the response-format adapter — the controller expects an array of
 * { label, address, placeId } objects. Consumer wires their own adapter listening
 * to `address-autocomplete:fetch` event (cancellable) and providing the response
 * via `address-autocomplete:suggestions` event with detail.{ suggestions }.
 *
 * Events dispatched (all bubble + composed) :
 *  address-autocomplete:mount             — { minQueryLength, debounceMs }
 *  address-autocomplete:fetch             — { query } — cancellable (consumer's adapter listens, fetches, dispatches:suggestions)
 *  address-autocomplete:suggestions-shown — { count }
 *  address-autocomplete:select            — { label, address, placeId } — when user picks a suggestion
 *  address-autocomplete:clear             — fired when user clears the input
 */

import { Controller } from '@hotwired/stimulus';

export default class AddressAutocompleteController extends Controller {
  static targets = ['input', 'suggestionsList', 'hiddenInput'];
  static values = {
    minQueryLength:    { type: Number, default: 3 },
    debounceMs:        { type: Number, default: 250 },
    consumerEndpoint:  { type: String, default: '' },
  };

  // Class fields initialized at construction.
  _destroyed = false;
  _debounceTimer = null;
  _lastQuery = '';
  _suggestions = [];

  connect() {
    this._destroyed = false;
    if (this.hasInputTarget) {
      this.inputTarget.addEventListener('input', this._onInputBound = (e) => this._onInput(e));
      this.inputTarget.addEventListener('keydown', this._onKeydownBound = (e) => this._onKeydown(e));
    }
    this.element.addEventListener('address-autocomplete:suggestions', this._onSuggestionsBound = (e) => this._onSuggestionsReceived(e));
    this._dispatch('address-autocomplete:mount', {
      minQueryLength: this.minQueryLengthValue,
      debounceMs: this.debounceMsValue,
    });
  }

  disconnect() {
    this._destroyed = true;
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    if (this.hasInputTarget && this._onInputBound) {
      this.inputTarget.removeEventListener('input', this._onInputBound);
      this.inputTarget.removeEventListener('keydown', this._onKeydownBound);
    }
    if (this._onSuggestionsBound) {
      this.element.removeEventListener('address-autocomplete:suggestions', this._onSuggestionsBound);
    }
  }

  _onInput(_event) {
    const query = (this.inputTarget.value || '').trim();
    if (this._debounceTimer) clearTimeout(this._debounceTimer);

    if (query.length === 0) {
      this._lastQuery = '';
      this._renderSuggestions([]);
      this._dispatch('address-autocomplete:clear', {});
      return;
    }

    if (query.length < this.minQueryLengthValue) {
      return;  // wait for more input
    }

    if (query === this._lastQuery) return;  // idempotency cache

    this._debounceTimer = setTimeout(() => {
      if (this._destroyed) return;
      this._lastQuery = query;
      this._triggerFetch(query);
    }, this.debounceMsValue);
  }

  _onKeydown(event) {
    // Arrow Down → focus first suggestion ; Arrow Up → focus last ; Esc → clear
    if (!this.hasSuggestionsListTarget) return;
    const items = this.suggestionsListTarget.querySelectorAll('[data-address-autocomplete-target="suggestionItem"]');
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (items.length) items[0].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (items.length) items[items.length - 1].focus();
    } else if (event.key === 'Escape') {
      this._clear();
    }
  }

  _triggerFetch(query) {
    const event = this._dispatch('address-autocomplete:fetch', { query }, /* cancellable */ true);
    if (event.defaultPrevented) return;
    // Default fetch behavior if consumer didn't cancel : GET consumerEndpoint?q=<query>
    if (this.consumerEndpointValue) {
      fetch(`${this.consumerEndpointValue}?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((suggestions) => {
          if (this._destroyed) return;
          this._renderSuggestions(Array.isArray(suggestions) ? suggestions : []);
        })
        .catch((err) => {
          // Silent fail — consumer wires error handling via consumer endpoint OR listens
          // to fetch errors via address-autocomplete:fetch + custom handler.
          console.warn('[address-autocomplete] fetch failed', err);
        });
    }
  }

  _onSuggestionsReceived(event) {
    // Consumer adapter dispatched suggestions externally (e.g. Google Places SDK callback).
    const suggestions = event.detail && event.detail.suggestions;
    this._renderSuggestions(Array.isArray(suggestions) ? suggestions : []);
  }

  _renderSuggestions(suggestions) {
    this._suggestions = suggestions;
    if (!this.hasSuggestionsListTarget) return;
    if (suggestions.length === 0) {
      this.suggestionsListTarget.innerHTML = '';
      this.suggestionsListTarget.setAttribute('hidden', '');
      return;
    }
    this.suggestionsListTarget.removeAttribute('hidden');
    this.suggestionsListTarget.innerHTML = suggestions
      .map((s, idx) => `<li role="option" tabindex="-1" data-address-autocomplete-target="suggestionItem" data-suggestion-index="${idx}" data-action="click->address-autocomplete#selectFromClick keydown.enter->address-autocomplete#selectFromKey">${this._escape(s.label || s.address || '')}</li>`)
      .join('');
    this._dispatch('address-autocomplete:suggestions-shown', { count: suggestions.length });
  }

  selectFromClick(event) {
    const idx = parseInt(event.currentTarget.dataset.suggestionIndex || '0', 10);
    this._select(idx);
  }

  selectFromKey(event) {
    event.preventDefault();
    const idx = parseInt(event.currentTarget.dataset.suggestionIndex || '0', 10);
    this._select(idx);
  }

  _select(idx) {
    const suggestion = this._suggestions[idx];
    if (!suggestion) return;
    if (this.hasInputTarget) {
      this.inputTarget.value = suggestion.label || suggestion.address || '';
    }
    if (this.hasHiddenInputTarget) {
      this.hiddenInputTarget.value = suggestion.placeId || suggestion.address || '';
    }
    this._renderSuggestions([]);  // collapse list
    this._dispatch('address-autocomplete:select', {
      label: suggestion.label,
      address: suggestion.address,
      placeId: suggestion.placeId,
    });
  }

  _clear() {
    if (this.hasInputTarget) this.inputTarget.value = '';
    this._lastQuery = '';
    this._renderSuggestions([]);
    this._dispatch('address-autocomplete:clear', {});
  }

  _escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  _dispatch(name, detail, cancellable = false) {
    const event = new CustomEvent(name, {
      bubbles: true,
      composed: true,
      cancelable: cancellable,
      detail,
    });
    this.element.dispatchEvent(event);
    return event;
  }
}
