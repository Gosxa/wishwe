// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedSearch } from './useDebouncedSearch';

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

describe('useDebouncedSearch', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('starts with the committed value', () => {
    const { result } = renderHook(() =>
      useDebouncedSearch('birthday cake', vi.fn()),
    );

    expect(result.current.value).toBe('birthday cake');
  });

  it('keeps the draft and commits its trimmed value after 500 ms', async () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useDebouncedSearch('', commit));

    act(() => result.current.onChange('  birthday cake  '));

    expect(result.current.value).toBe('  birthday cake  ');

    await advance(499);
    expect(commit).not.toHaveBeenCalled();

    await advance(1);
    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith('birthday cake');
  });

  it('restarts the debounce when the draft changes', async () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useDebouncedSearch('', commit));

    act(() => result.current.onChange('birth'));
    await advance(300);
    act(() => result.current.onChange('birthday'));
    await advance(499);

    expect(commit).not.toHaveBeenCalled();

    await advance(1);
    expect(commit).toHaveBeenCalledWith('birthday');
  });

  it('commits immediately on search and cancels the pending debounce', async () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useDebouncedSearch('', commit));

    act(() => result.current.onChange('party'));
    await advance(200);
    act(() => result.current.onSearch('  party tonight  '));

    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith('party tonight');

    await advance(500);
    expect(commit).toHaveBeenCalledOnce();
  });

  it('follows a new committed value and cancels the old draft', async () => {
    const commit = vi.fn();
    const { result, rerender } = renderHook(
      ({ committed }) => useDebouncedSearch(committed, commit),
      { initialProps: { committed: 'first search' } },
    );

    act(() => result.current.onChange('local draft'));
    await advance(200);
    rerender({ committed: 'search from history' });

    expect(result.current.value).toBe('search from history');

    await advance(500);
    expect(commit).not.toHaveBeenCalled();
  });

  it('cancels a pending commit on unmount', async () => {
    const commit = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedSearch('', commit),
    );

    act(() => result.current.onChange('party'));
    unmount();
    await advance(500);

    expect(commit).not.toHaveBeenCalled();
  });
});
