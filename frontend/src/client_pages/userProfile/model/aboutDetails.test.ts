import { describe, expect, it } from 'vitest';
import { getBirthday, getFullName, getSocialLink } from './aboutDetails';

describe('getFullName', () => {
  it('joins trimmed first and last names', () => {
    expect(getFullName(' Sofia ', 'Smirnova ')).toBe('Sofia Smirnova');
  });

  it('uses whichever part is present', () => {
    expect(getFullName('Sofia', null)).toBe('Sofia');
    expect(getFullName(undefined, 'Smirnova')).toBe('Smirnova');
  });

  it('returns null when both parts are blank', () => {
    expect(getFullName('  ', '')).toBeNull();
    expect(getFullName(null, undefined)).toBeNull();
  });
});

describe('getBirthday', () => {
  const today = new Date(2026, 9, 14);

  it('formats the date without shifting it across time zones', () => {
    expect(getBirthday('2001-11-04', today)).toEqual({
      label: 'November 4, 2001',
      hint: '24 years old',
    });
  });

  it('counts the age once the birthday has passed this year', () => {
    expect(getBirthday('2000-10-13', today)?.hint).toBe('26 years old');
  });

  it('celebrates a birthday that falls on today', () => {
    expect(getBirthday('1998-10-14', today)?.hint).toBe('Turns 28 today');
  });

  it('uses the singular for a one-year-old', () => {
    expect(getBirthday('2025-01-01', today)?.hint).toBe('1 year old');
  });

  it('omits the hint for dates that are not in the past', () => {
    expect(getBirthday('2026-12-01', today)).toEqual({
      label: 'December 1, 2026',
      hint: null,
    });
  });

  it('rejects missing, malformed and impossible dates', () => {
    expect(getBirthday(null, today)).toBeNull();
    expect(getBirthday('', today)).toBeNull();
    expect(getBirthday('04.11.2001', today)).toBeNull();
    expect(getBirthday('2001-02-30', today)).toBeNull();
  });
});

describe('getSocialLink', () => {
  it('builds a compact label from the host and path', () => {
    expect(getSocialLink('https://www.instagram.com/smirnyxa/')).toEqual({
      href: 'https://www.instagram.com/smirnyxa/',
      label: 'instagram.com/smirnyxa',
    });
  });

  it('shows only the host for a bare domain', () => {
    expect(getSocialLink('http://t.me')?.label).toBe('t.me');
  });

  it('rejects values that are not http(s) links', () => {
    expect(getSocialLink('javascript:alert(1)')).toBeNull();
    expect(getSocialLink('instagram.com/smirnyxa')).toBeNull();
    expect(getSocialLink('  ')).toBeNull();
    expect(getSocialLink(null)).toBeNull();
  });
});
