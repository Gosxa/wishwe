import { describe, expect, it } from 'vitest';
import { safeNextPath } from './nextPath';

describe('safeNextPath', () => {
  it.each([
    ['the root page', '/', '/'],
    ['a protected page', '/feed', '/feed'],
    [
      'a nested page and its query',
      '/user/alice?filter=wishes&sort=soonest',
      '/user/alice?filter=wishes&sort=soonest',
    ],
    [
      'encoded path and query values',
      '/user/alice%20smith?title=birthday%20cake',
      '/user/alice%20smith?title=birthday%20cake',
    ],
    [
      'a URL-looking query value',
      '/feed?source=https%3A%2F%2Fexample.com%2Foffer',
      '/feed?source=https%3A%2F%2Fexample.com%2Foffer',
    ],
  ])('keeps %s on this site', (_label, value, expected) => {
    expect(safeNextPath(value)).toBe(expected);
  });

  it('normalizes dot segments and drops fragments', () => {
    expect(safeNextPath('/user/alice/../bob?tab=plans#private')).toBe(
      '/user/bob?tab=plans',
    );
    expect(safeNextPath('/user/%2e%2e/feed')).toBe('/feed');
  });

  it.each([
    ['an HTTPS URL', 'https://example.com/feed'],
    ['an HTTP URL', 'http://example.com/feed'],
    ['a JavaScript URL', 'javascript:alert(1)'],
    ['a data URL', 'data:text/html,hello'],
    ['a path without a leading slash', 'feed?filter=plans'],
  ])('rejects %s', (_label, value) => {
    expect(safeNextPath(value)).toBeNull();
  });

  it.each([
    ['two slashes', '//example.com/feed'],
    ['three slashes', '///example.com/feed'],
    ['a slash and a backslash', '/\\example.com/feed'],
    ['several mixed slashes', '/\\/example.com/feed'],
  ])('rejects a host written with %s', (_label, value) => {
    expect(safeNextPath(value)).toBeNull();
  });

  it('normalizes backslashes which stay inside the local path', () => {
    expect(safeNextPath('/user\\alice?tab=plans')).toBe(
      '/user/alice?tab=plans',
    );
  });

  it.each([
    '/api',
    '/api/',
    '/api/events',
    '/api?event=42',
    '/next_api',
    '/next_api/user/profile',
    '/onboard',
    '/onboard/login?next=%2Ffeed',
  ])('rejects blocked application path %s', value => {
    expect(safeNextPath(value)).toBeNull();
  });

  it.each(['/apiary', '/next_apiary', '/onboarding'])(
    'does not block a page that only starts with a similar name: %s',
    value => {
      expect(safeNextPath(value)).toBe(value);
    },
  );

  it('checks the normalized form of encoded dot segments', () => {
    expect(safeNextPath('/feed/%2e%2e/api/events')).toBeNull();
    expect(safeNextPath('/profile/%2E%2E/next_api/user')).toBeNull();
    expect(safeNextPath('/friends/%2e./onboard')).toBeNull();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['an invalid host', '//[invalid'],
  ])('returns null for %s', (_label, value) => {
    expect(safeNextPath(value)).toBeNull();
  });
});
