import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatRelative,
  formatDate,
  formatTime,
  formatContextual,
  setDayjsLocale,
  getDayjsLocale,
} from '../../src/js/utils/format-date.js';

describe('theme/js/utils/format-date.js', () => {
  beforeEach(() => {
    setDayjsLocale('fr');
  });

  it('boots with fr locale by default', () => {
    expect(getDayjsLocale()).toBe('fr');
  });

  it('switches locale via setDayjsLocale', () => {
    setDayjsLocale('en');
    expect(getDayjsLocale()).toBe('en');
  });

  it('formatRelative returns localized relative duration', () => {
    const base = new Date('2026-05-14T12:00:00Z');
    const past = new Date('2026-05-14T11:55:00Z');
    expect(formatRelative(past, { baseDate: base })).toMatch(/il y a/);
  });

  it('formatRelative honors locale override', () => {
    const base = new Date('2026-05-14T12:00:00Z');
    const past = new Date('2026-05-14T11:55:00Z');
    expect(formatRelative(past, { locale: 'en', baseDate: base })).toMatch(/ago/);
  });

  it('formatDate uses long localized format by default (LL)', () => {
    const result = formatDate('2026-05-13');
    expect(result).toMatch(/13 mai 2026/);
  });

  it('formatDate honors a custom format token', () => {
    const result = formatDate('2026-05-13', { format: 'YYYY-MM-DD' });
    expect(result).toBe('2026-05-13');
  });

  it('formatDate honors locale override', () => {
    const result = formatDate('2026-05-13', { locale: 'en' });
    expect(result).toMatch(/May 13, 2026/);
  });

  it('formatTime returns 24h HH:mm by default', () => {
    const result = formatTime('2026-05-13T14:32:00');
    expect(result).toBe('14:32');
  });

  it('formatContextual returns relative for < 24h', () => {
    const base = new Date('2026-05-14T12:00:00Z');
    const fewMinAgo = new Date('2026-05-14T11:45:00Z');
    const result = formatContextual(fewMinAgo, { baseDate: base });
    expect(result).toMatch(/il y a/);
  });

  it('formatContextual returns absolute LL for older than 7 days', () => {
    const base = new Date('2026-05-14T12:00:00Z');
    const longAgo = new Date('2026-04-14T12:00:00Z');
    const result = formatContextual(longAgo, { baseDate: base });
    expect(result).toMatch(/14 avril 2026/);
  });

  it('formatRelative accepts a Date object as baseDate', () => {
    const future = new Date('2026-05-14T13:00:00Z');
    const base = new Date('2026-05-14T12:00:00Z');
    expect(formatRelative(future, { baseDate: base })).toMatch(/dans/);
  });
});
