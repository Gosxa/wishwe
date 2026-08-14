// @vitest-environment jsdom

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSearchDisabledSync } from './useSearchDisabledSync';

type HookProps = {
  events: unknown[];
  onChange?: (disabled: boolean) => void;
  searchQuery: string;
};

describe('useSearchDisabledSync', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    {
      disabled: true,
      events: [],
      name: 'disables search for an empty feed and blank query',
      searchQuery: '   ',
    },
    {
      disabled: false,
      events: [{ id: 'event' }],
      name: 'keeps search enabled when the feed has an event',
      searchQuery: '',
    },
    {
      disabled: false,
      events: [],
      name: 'keeps search enabled while a trimmed query is active',
      searchQuery: '  birthday  ',
    },
  ])('$name', scenario => {
    const onChange = vi.fn();

    renderHook(() =>
      useSearchDisabledSync(onChange, scenario.events, scenario.searchQuery),
    );

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(scenario.disabled);
  });

  it('updates the parent when the feed state changes', () => {
    const onChange = vi.fn();
    const { rerender } = renderHook(
      ({ events, searchQuery }: HookProps) =>
        useSearchDisabledSync(onChange, events, searchQuery),
      { initialProps: { events: [] as unknown[], searchQuery: '' } },
    );

    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender({ events: [{ id: 'event' }], searchQuery: '' });

    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('does not rerun for a new event array with the same length', () => {
    const onChange = vi.fn();
    const { rerender } = renderHook(
      ({ events }: { events: unknown[] }) =>
        useSearchDisabledSync(onChange, events, ''),
      { initialProps: { events: [{ id: 'first' }] } },
    );

    onChange.mockClear();
    rerender({ events: [{ id: 'replacement' }] });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('restores the enabled state when the consumer unmounts', () => {
    const onChange = vi.fn();
    const { unmount } = renderHook(() =>
      useSearchDisabledSync(onChange, [], ''),
    );

    expect(onChange).toHaveBeenLastCalledWith(true);

    unmount();

    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('allows callers to omit the change callback', () => {
    const { unmount } = renderHook(() =>
      useSearchDisabledSync(undefined, [], ''),
    );

    expect(unmount).not.toThrow();
  });
});
