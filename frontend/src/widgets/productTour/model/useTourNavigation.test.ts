// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTourNavigation } from './useTourNavigation';

describe('useTourNavigation', () => {
  afterEach(cleanup);

  const setup = (stepsCount: number) => {
    const onEnd = vi.fn();
    const { result, ...rest } = renderHook(() =>
      useTourNavigation(stepsCount, onEnd),
    );

    return { result, onEnd, ...rest };
  };

  it('starts on the first step', () => {
    const { result } = setup(3);

    expect(result.current.index).toBe(0);
    expect(result.current.isLast).toBe(false);
  });

  it('walks forward one step at a time', () => {
    const { result, onEnd } = setup(3);

    act(() => result.current.goNext());
    expect(result.current.index).toBe(1);

    act(() => result.current.goNext());
    expect(result.current.index).toBe(2);
    expect(result.current.isLast).toBe(true);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('walks back one step at a time', () => {
    const { result } = setup(3);

    act(() => result.current.goNext());
    act(() => result.current.goNext());
    act(() => result.current.goBack());

    expect(result.current.index).toBe(1);
  });

  it('stays on the first step when going back from it', () => {
    const { result } = setup(3);

    act(() => result.current.goBack());
    act(() => result.current.goBack());

    expect(result.current.index).toBe(0);
  });

  it('finishes when advancing past the last step', () => {
    const { result, onEnd } = setup(2);

    act(() => result.current.goNext());
    act(() => result.current.goNext());

    expect(onEnd).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledWith('finished');
    expect(result.current.index).toBe(1);
  });

  it('treats a single-step tour as already on the last step', () => {
    const { result, onEnd } = setup(1);

    expect(result.current.isLast).toBe(true);

    act(() => result.current.goNext());

    expect(onEnd).toHaveBeenCalledWith('finished');
  });

  it('reports the reason a caller ends the tour with', () => {
    const { result, onEnd } = setup(3);

    act(() => result.current.end('skipped'));

    expect(onEnd).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledWith('skipped');
  });

  it('ends only once no matter how often it is asked to', () => {
    const { result, onEnd } = setup(3);

    act(() => {
      result.current.end('skipped');
      result.current.end('finished');
    });

    expect(onEnd).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledWith('skipped');
  });

  it('ignores a late goNext after the tour already ended', () => {
    const { result, onEnd } = setup(3);

    act(() => result.current.end('skipped'));
    act(() => result.current.goNext());

    expect(onEnd).toHaveBeenCalledOnce();
    expect(result.current.index).toBe(0);
  });

  it('does not finish twice when goNext fires again on the last step', () => {
    const { result, onEnd } = setup(2);

    act(() => result.current.goNext());
    act(() => result.current.goNext());
    act(() => result.current.goNext());

    expect(onEnd).toHaveBeenCalledOnce();
  });
});
