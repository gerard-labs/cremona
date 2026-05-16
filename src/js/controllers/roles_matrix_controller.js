/**
 * roles_matrix_controller.js — Ring 3 pattern controller (S4.1c Phase 3, post-ADR-0042).
 *
 * Manages the RolesMatrix N×M cells with per-cell Badge default + Combobox lazy
 * instantiation on cell click (edit mode). Per OQ-NEW-S4.1c-Team-Roles-Matrix-perf-strategy
 * sealed (c) : ~200× perf gain vs pure composition with 200 Combobox at mount.
 *
 * Path X² Typical bucket (~40 % JSDoc) per ADR-0034 + ADR-0042 controller scope.
 *
 * Per-cell editing flow :
 *   1. Cell click → openEditor() → swap cell content from Badge to a select-like
 *      element + open native HTML select OR Combobox (lightweight inline).
 *   2. On change → commitEdit() : dispatch `cell-edit-commit` + revert to Badge with new role.
 *   3. On blur/Esc/outside-click → cancelEdit() : revert to Badge with previous role.
 *
 * Note : v0 uses a lightweight inline native <select> instead of full Combobox Ring 2
 * to avoid Combobox bundle cost per cell. Combobox upgrade deferred to consumer demand
 * (richer search/filter UX) via amend ADR.
 *
 * Events (bubbles + composed) :
 *   roles-matrix:mount             — detail.{}
 *   roles-matrix:cell-edit-start   — detail.{ row, col, currentRole }
 *   roles-matrix:cell-edit-commit  — detail.{ row, col, newRole, previousRole }
 *   roles-matrix:cell-edit-cancel  — detail.{ row, col }
 *   roles-matrix:bulk-edit-toggle  — detail.{ bulkEdit }
 */

import { Controller } from '@hotwired/stimulus';

export default class RolesMatrixController extends Controller {
  static targets = ['cell', 'bulkEditToggle'];
  static values = { bulkEdit: Boolean, roles: Array };

  connect() {
    this._destroyed = false;
    this._activeCell = null;
    this._activeSelect = null;
    this._activeBadgeBackup = null;
    this._onDocClick = this._handleDocClick.bind(this);
    document.addEventListener('click', this._onDocClick, true);
    this._dispatch('roles-matrix:mount', {});
  }

  disconnect() {
    this._destroyed = true;
    document.removeEventListener('click', this._onDocClick, true);
    if (this._activeCell) this._cancelEdit();
  }

  /** Wired via `click->roles-matrix#openEditor`. */
  openEditor(event) {
    if (this._destroyed) return;
    const cell = event.currentTarget;
    if (!cell || cell === this._activeCell) return;
    if (this._activeCell) this._cancelEdit();
    this._activeCell = cell;
    const row = cell.dataset.row || '';
    const col = cell.dataset.col || '';
    const currentRole = cell.dataset.currentRole || 'none';
    this._activeBadgeBackup = cell.innerHTML;
    cell.innerHTML = this._buildSelectMarkup(currentRole);
    const select = cell.querySelector('select');
    if (select) {
      this._activeSelect = select;
      select.addEventListener('change', this._handleSelectChange.bind(this));
      select.addEventListener('keydown', this._handleSelectKeydown.bind(this));
      select.focus();
    }
    this._dispatch('roles-matrix:cell-edit-start', { row, col, currentRole });
  }

  /** Wired via `keydown->roles-matrix#keyOpenEditor` — Enter/Space on cell. */
  keyOpenEditor(event) {
    if (this._destroyed) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.openEditor(event);
  }

  /** Wired via `click->roles-matrix#toggleBulkEdit`. */
  toggleBulkEdit() {
    if (this._destroyed) return;
    this.bulkEditValue = !this.bulkEditValue;
    if (this.hasBulkEditToggleTarget) {
      this.bulkEditToggleTarget.setAttribute('aria-pressed', this.bulkEditValue ? 'true' : 'false');
      this.bulkEditToggleTarget.dataset.variant = this.bulkEditValue ? 'primary' : 'secondary';
    }
    this._dispatch('roles-matrix:bulk-edit-toggle', { bulkEdit: this.bulkEditValue });
  }

  _handleSelectChange(event) {
    if (this._destroyed || !this._activeCell) return;
    const select = event.currentTarget;
    const newRole = select.value;
    const previousRole = this._activeCell.dataset.currentRole || 'none';
    const row = this._activeCell.dataset.row || '';
    const col = this._activeCell.dataset.col || '';
    this._activeCell.dataset.currentRole = newRole;
    this._activeCell.innerHTML = this._buildBadgeMarkup(newRole);
    this._activeCell = null;
    this._activeSelect = null;
    this._activeBadgeBackup = null;
    this._dispatch('roles-matrix:cell-edit-commit', { row, col, newRole, previousRole });
  }

  _handleSelectKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this._cancelEdit();
    }
  }

  _handleDocClick(event) {
    if (this._destroyed || !this._activeCell) return;
    if (this._activeCell.contains(event.target)) return;
    this._cancelEdit();
  }

  _cancelEdit() {
    if (!this._activeCell) return;
    const row = this._activeCell.dataset.row || '';
    const col = this._activeCell.dataset.col || '';
    this._activeCell.innerHTML = this._activeBadgeBackup || '';
    this._activeCell = null;
    this._activeSelect = null;
    this._activeBadgeBackup = null;
    this._dispatch('roles-matrix:cell-edit-cancel', { row, col });
  }

  _buildSelectMarkup(currentRole) {
    const roles = Array.isArray(this.rolesValue) ? this.rolesValue : [];
    const options = roles
      .map((r) => `<option value="${this._escape(r.value)}" ${r.value === currentRole ? 'selected' : ''}>${this._escape(r.label)}</option>`)
      .join('');
    return `<select class="theme-roles-matrix__cell-select" autofocus>${options}</select>`;
  }

  _buildBadgeMarkup(role) {
    const roles = Array.isArray(this.rolesValue) ? this.rolesValue : [];
    const found = roles.find((r) => r.value === role) || { value: role, label: role, badgeVariant: 'muted' };
    return `<span class="theme-badge" data-variant="${this._escape(found.badgeVariant || 'muted')}">${this._escape(found.label || role)}</span>`;
  }

  _escape(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  _dispatch(name, detail) {
    this.element.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
    }));
  }
}
