// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigationMocks = vi.hoisted(() => ({
  useSearchParams: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: navigationMocks.useSearchParams,
}));

import { useProfileSearch } from './useProfileSearch';

describe('useProfileSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/profile');
    navigationMocks.useSearchParams.mockImplementation(
      () => new URLSearchParams(window.location.search),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reads the title and replaces the profile URL when committing', async () => {
    window.history.replaceState(
      null,
      '',
      '/profile?filter=wishes&event=42&title=old+title',
    );
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useProfileSearch());

    expect(result.current.value).toBe('old title');

    act(() => result.current.onChange('  birthday cake  '));
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/profile?filter=wishes&event=42&title=birthday+cake',
    );
  });

  it('removes only the title parameter for a blank search', () => {
    window.history.replaceState(
      null,
      '',
      '/profile?filter=archive&title=old+title',
    );
    const { result } = renderHook(() => useProfileSearch());

    act(() => result.current.onSearch('   '));

    expect(window.location.pathname).toBe('/profile');
    expect(window.location.search).toBe('?filter=archive');
  });
});
