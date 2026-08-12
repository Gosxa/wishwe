// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCodeInput } from './useCodeInput';

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

const backspaceEvent = {
  key: 'Backspace',
} as KeyboardEvent<HTMLInputElement>;

describe('useCodeInput', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps only the last digit and advances focus', () => {
    const { result } = renderHook(() => useCodeInput());
    const focusNext = vi.fn();

    result.current.inputRefs.current[1] = {
      focus: focusNext,
    } as unknown as HTMLInputElement;

    act(() => result.current.onChange(0, changeEvent('a12')));

    expect(result.current.values).toEqual(['2', '', '', '', '', '']);
    expect(result.current.code).toBe('2');
    expect(result.current.isComplete).toBe(false);
    expect(focusNext).toHaveBeenCalledOnce();
  });

  it('clears the current digit before moving backward', () => {
    const { result } = renderHook(() => useCodeInput());
    const focusPrevious = vi.fn();

    result.current.inputRefs.current[0] = {
      focus: focusPrevious,
    } as unknown as HTMLInputElement;

    act(() => result.current.onChange(0, changeEvent('1')));
    act(() => result.current.onChange(1, changeEvent('2')));
    act(() => result.current.onKeyDown(1, backspaceEvent));

    expect(result.current.values.slice(0, 2)).toEqual(['1', '']);
    expect(focusPrevious).not.toHaveBeenCalled();

    act(() => result.current.onKeyDown(1, backspaceEvent));

    expect(result.current.values.slice(0, 2)).toEqual(['', '']);
    expect(focusPrevious).toHaveBeenCalledOnce();
  });

  it('ignores keys other than Backspace', () => {
    const { result } = renderHook(() => useCodeInput());

    act(() => result.current.onChange(0, changeEvent('7')));
    act(() =>
      result.current.onKeyDown(0, {
        key: 'Delete',
      } as KeyboardEvent<HTMLInputElement>),
    );

    expect(result.current.values[0]).toBe('7');
  });

  it('pastes up to six digits, prevents default, and focuses the last cell', () => {
    const { result } = renderHook(() => useCodeInput());
    const preventDefault = vi.fn();
    const focusLast = vi.fn();

    result.current.inputRefs.current[5] = {
      focus: focusLast,
    } as unknown as HTMLInputElement;
    const pasteEvent = {
      preventDefault,
      clipboardData: { getData: () => '12a34-5678' },
    } as unknown as ClipboardEvent<HTMLInputElement>;

    act(() => result.current.onPaste(pasteEvent));

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(result.current.values).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(result.current.code).toBe('123456');
    expect(result.current.isComplete).toBe(true);
    expect(focusLast).toHaveBeenCalledOnce();
  });
});
