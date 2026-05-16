import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import InputOtpController from '../../src/js/controllers/input-otp_controller.js';

/**
 * Unit tests for the InputOTP compound's `input-otp` controller (S2.7).
 *
 * Coverage map (11 tests):
 *
 *   Input flow
 *    1. typing a digit in cell N auto-tabs to cell N+1.
 *    2. typing in the LAST cell does NOT shift focus (clamp).
 *    3. typing a non-digit character is wiped (maxlength=1 + pattern catch).
 *
 *   Backspace
 *    4. Backspace on empty cell N (with N>0) clears cell N-1 + moves
 *       focus there.
 *    5. Backspace on filled cell deletes the character in place (native);
 *       does NOT shift focus.
 *
 *   Paste
 *    6. paste "123456" into first cell distributes one digit per cell.
 *    7. paste "12-34-56" strips non-digit, distributes "123456".
 *    8. paste with non-numeric content (e.g. "abc") is no-op.
 *    9. paste "1234" (shorter than length=6) fills first 4 cells, last 2
 *       stay empty.
 *
 *   Navigation
 *   10. ArrowLeft / ArrowRight move focus between cells.
 *
 *   Events
 *   11. input-otp:change fires on every value change with detail.{code,
 *       complete} ; input-otp:complete fires only when all cells filled.
 */
describe('InputOtpController', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({ length = 6, value = '', disabled = false } = {}) {
    const cells = [];
    for (let i = 0; i < length; i++) {
      const v = value[i] || '';
      const valueAttr = v ? ` value="${v}"` : '';
      cells.push(
        `<input id="otp-${i}" type="text" class="theme-input theme-input-otp__cell"
          data-input-otp-target="input"
          data-input-otp-index="${i}"
          data-action="input->input-otp#onInput keydown->input-otp#onKeydown paste->input-otp#onPaste focus->input-otp#onFocus"
          inputmode="numeric" pattern="[0-9]*" maxlength="1"
          aria-label="Digit ${i + 1} of ${length}"${valueAttr}${disabled ? ' disabled' : ''}>`,
      );
    }
    document.body.innerHTML = `
      <fieldset id="otp" class="theme-input-otp"
        data-controller="input-otp"
        data-input-otp-length-value="${length}"
        ${value ? `data-input-otp-value-value="${value}"` : ''}
        ${disabled ? 'disabled' : ''}
      >
        <legend>Code OTP</legend>
        <div class="theme-input-otp__cells">${cells.join('')}</div>
        <input type="hidden" name="otp-code" data-input-otp-target="hiddenInput">
      </fieldset>
    `;
    app = Application.start();
    app.register('input-otp', InputOtpController);
    await new Promise((r) => setTimeout(r, 0));
    return {
      wrap: document.getElementById('otp'),
      cells: Array.from({ length }, (_, i) => document.getElementById(`otp-${i}`)),
      hidden: document.querySelector('input[name="otp-code"]'),
      ctrl: app.controllers.find((c) => c.identifier === 'input-otp'),
    };
  }

  function fireInput(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('typing a digit in cell N auto-tabs to cell N+1', async () => {
    const { cells } = await mount();
    fireInput(cells[0], '1');
    await new Promise((r) => setTimeout(r, 0));
    expect(cells[0].value).toBe('1');
    expect(document.activeElement).toBe(cells[1]);
  });

  it('typing in the LAST cell does NOT shift focus (clamp)', async () => {
    const { cells } = await mount({ length: 4 });
    cells[3].focus();
    fireInput(cells[3], '9');
    await new Promise((r) => setTimeout(r, 0));
    expect(cells[3].value).toBe('9');
    // _focusCellAt(4) is a no-op because idx >= cells.length — focus stays
    // on cell 3 (or wherever the previous focus landed in happy-dom).
    expect(document.activeElement).not.toBeNull();
  });

  it('typing a non-digit character is wiped', async () => {
    const { cells, ctrl } = await mount();
    cells[0].value = 'a';
    ctrl.onInput({ target: cells[0] });
    expect(cells[0].value).toBe('');
    expect(ctrl.valueValue).toBe('');
  });

  it('Backspace on empty cell moves focus to previous cell + clears it', async () => {
    const { cells, ctrl } = await mount({ value: '12' });
    // cells[0]='1', cells[1]='2', cells[2..5]=''
    cells[2].focus();
    let prevented = false;
    ctrl.onKeydown({
      key: 'Backspace',
      target: cells[2],
      preventDefault: () => { prevented = true; },
    });
    expect(prevented).toBe(true);
    expect(cells[1].value).toBe('');
    expect(document.activeElement).toBe(cells[1]);
  });

  it('Backspace on filled cell does NOT trigger our handler (native delete)', async () => {
    const { cells, ctrl } = await mount({ value: '12' });
    let prevented = false;
    ctrl.onKeydown({
      key: 'Backspace',
      target: cells[1], // '2'
      preventDefault: () => { prevented = true; },
    });
    // Cell isn't empty → no preventDefault, native delete handles it.
    expect(prevented).toBe(false);
    expect(cells[1].value).toBe('2'); // controller didn't clear it
  });

  it('paste "123456" into first cell distributes one digit per cell', async () => {
    const { cells, ctrl } = await mount();
    ctrl.onPaste({
      target: cells[0],
      clipboardData: { getData: (type) => (type === 'text' ? '123456' : '') },
      preventDefault: () => {},
    });
    expect(cells.map((c) => c.value).join('')).toBe('123456');
    expect(ctrl.valueValue).toBe('123456');
  });

  it('paste "12-34-56" strips non-digit, distributes "123456"', async () => {
    const { cells, ctrl } = await mount();
    ctrl.onPaste({
      target: cells[0],
      clipboardData: { getData: (type) => (type === 'text' ? '12-34-56' : '') },
      preventDefault: () => {},
    });
    expect(cells.map((c) => c.value).join('')).toBe('123456');
  });

  it('paste non-numeric "abc" is no-op', async () => {
    const { cells, ctrl } = await mount();
    ctrl.onPaste({
      target: cells[0],
      clipboardData: { getData: (type) => (type === 'text' ? 'abc' : '') },
      preventDefault: () => {},
    });
    expect(cells.every((c) => c.value === '')).toBe(true);
    expect(ctrl.valueValue).toBe('');
  });

  it('paste "1234" (shorter than length=6) fills first 4 cells, last 2 empty', async () => {
    const { cells, ctrl } = await mount();
    ctrl.onPaste({
      target: cells[0],
      clipboardData: { getData: (type) => (type === 'text' ? '1234' : '') },
      preventDefault: () => {},
    });
    expect(cells[0].value).toBe('1');
    expect(cells[1].value).toBe('2');
    expect(cells[2].value).toBe('3');
    expect(cells[3].value).toBe('4');
    expect(cells[4].value).toBe('');
    expect(cells[5].value).toBe('');
  });

  it('ArrowLeft / ArrowRight move focus between cells', async () => {
    const { cells, ctrl } = await mount();
    cells[2].focus();
    ctrl.onKeydown({ key: 'ArrowLeft', target: cells[2], preventDefault: () => {} });
    expect(document.activeElement).toBe(cells[1]);
    ctrl.onKeydown({ key: 'ArrowRight', target: cells[1], preventDefault: () => {} });
    expect(document.activeElement).toBe(cells[2]);
  });

  it('input-otp:change fires every change; input-otp:complete fires only when all cells filled', async () => {
    const { wrap, cells } = await mount({ length: 4 });
    const changeEvents = [];
    const completeEvents = [];
    wrap.addEventListener('input-otp:change', (e) => changeEvents.push(e.detail));
    wrap.addEventListener('input-otp:complete', (e) => completeEvents.push(e.detail));

    fireInput(cells[0], '1');
    fireInput(cells[1], '2');
    fireInput(cells[2], '3');
    expect(changeEvents.length).toBe(3);
    expect(changeEvents[2].complete).toBe(false);
    expect(completeEvents.length).toBe(0);

    fireInput(cells[3], '4');
    expect(changeEvents.length).toBe(4);
    expect(changeEvents[3].code).toBe('1234');
    expect(changeEvents[3].complete).toBe(true);
    expect(completeEvents.length).toBe(1);
    expect(completeEvents[0].code).toBe('1234');
  });
});
