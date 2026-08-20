// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasSeenLocally, rememberLocally } from './feedTourStorage';

describe('feedTourStorage', () => {
  let store: Map<string, string>;
  let getItem: ReturnType<typeof vi.fn>;
  let setItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = new Map();
    getItem = vi.fn((key: string) => store.get(key) ?? null);
    setItem = vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    });

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { getItem, setItem },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'localStorage');
  });

  it('reports an unseen tour for a fresh profile', () => {
    expect(hasSeenLocally(7)).toBe(false);
  });

  it('remembers that a profile has seen the tour', () => {
    rememberLocally(7);

    expect(hasSeenLocally(7)).toBe(true);
  });

  it('keeps the flag per profile so a second account still gets the tour', () => {
    rememberLocally(7);

    expect(hasSeenLocally(8)).toBe(false);
  });

  it('namespaces the key so it cannot collide with other app storage', () => {
    rememberLocally(7);

    expect(setItem).toHaveBeenCalledWith('wishwe:feed-tour-seen:7', '1');
  });

  it('does not treat an unrelated stored value as seen', () => {
    store.set('wishwe:feed-tour-seen:7', 'true');

    expect(hasSeenLocally(7)).toBe(false);
  });

  it('reports unseen when storage is unavailable', () => {
    getItem.mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(hasSeenLocally(7)).toBe(false);
  });

  it('stays silent when storage refuses to write', () => {
    setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => rememberLocally(7)).not.toThrow();
  });
});
