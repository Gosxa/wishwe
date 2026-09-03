// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readGeolocationPermission } from './permission';

const stubNavigator = (overrides: Record<string, unknown>) => {
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: { getCurrentPosition: vi.fn() },
    ...overrides,
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readGeolocationPermission', () => {
  it.each(['granted', 'denied', 'prompt'] as const)(
    'passes through the "%s" the browser reports',
    async state => {
      stubNavigator({ permissions: { query: vi.fn(async () => ({ state })) } });

      await expect(readGeolocationPermission()).resolves.toBe(state);
    },
  );

  it('asks about geolocation specifically', async () => {
    const query = vi.fn(async () => ({ state: 'prompt' }));

    stubNavigator({ permissions: { query } });
    await readGeolocationPermission();

    expect(query).toHaveBeenCalledWith({ name: 'geolocation' });
  });

  it('is unknown where the Permissions API is missing', async () => {
    stubNavigator({ permissions: undefined });

    await expect(readGeolocationPermission()).resolves.toBe('unknown');
  });

  it('is unknown where the query throws, as Safari once did', async () => {
    stubNavigator({
      permissions: {
        query: vi.fn(async () => {
          throw new TypeError('geolocation is not a valid permission name');
        }),
      },
    });

    await expect(readGeolocationPermission()).resolves.toBe('unknown');
  });

  it('is unsupported before it is anything else', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: undefined,
      permissions: { query: vi.fn() },
    });

    await expect(readGeolocationPermission()).resolves.toBe('unsupported');
  });
});
