// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const userApiMocks = vi.hoisted(() => ({
  createInvite: vi.fn(),
}));

vi.mock('@/shared/client_api/user', () => ({
  createInvite: userApiMocks.createInvite,
}));

import { useInviteLink } from './useInviteLink';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

describe('useInviteLink', () => {
  const clipboardWrite = vi.fn();
  const clipboardWriteText = vi.fn();
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard',
  );

  beforeEach(() => {
    vi.useFakeTimers();
    userApiMocks.createInvite.mockReset();
    clipboardWrite.mockReset().mockResolvedValue(undefined);
    clipboardWriteText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: clipboardWrite,
        writeText: clipboardWriteText,
      },
    });
    vi.stubGlobal('ClipboardItem', undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();

    if (originalClipboardDescriptor) {
      Object.defineProperty(
        navigator,
        'clipboard',
        originalClipboardDescriptor,
      );
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('creates and copies an invite before resetting the success status', async () => {
    userApiMocks.createInvite.mockResolvedValueOnce({ token: 'invite-token' });
    const { result } = renderHook(() => useInviteLink());

    await act(async () => {
      await result.current.copy();
    });

    expect(userApiMocks.createInvite).toHaveBeenCalledOnce();
    expect(clipboardWriteText).toHaveBeenCalledWith(
      `${window.location.origin}/invite/invite-token`,
    );
    expect(result.current.status).toBe('copied');

    await advance(2499);
    expect(result.current.status).toBe('copied');

    await advance(1);
    expect(result.current.status).toBe('idle');
  });

  it('reports copying while invite creation is still pending', async () => {
    const invite = deferred<{ token: string }>();

    userApiMocks.createInvite.mockReturnValueOnce(invite.promise);
    const { result } = renderHook(() => useInviteLink());
    let copyPromise!: Promise<void>;

    act(() => {
      copyPromise = result.current.copy();
    });

    expect(result.current.status).toBe('copying');
    expect(clipboardWriteText).not.toHaveBeenCalled();

    invite.resolve({ token: 'ready' });
    await act(async () => {
      await copyPromise;
    });

    expect(clipboardWriteText).toHaveBeenCalledWith(
      `${window.location.origin}/invite/ready`,
    );
    expect(result.current.status).toBe('copied');
  });

  it('uses ClipboardItem when asynchronous clipboard writes are available', async () => {
    class TestClipboardItem {
      constructor(readonly data: Record<string, Promise<Blob>>) {}
    }

    class TestBlob {
      constructor(
        readonly parts: BlobPart[],
        readonly options: BlobPropertyBag,
      ) {}
    }

    vi.stubGlobal('ClipboardItem', TestClipboardItem);
    vi.stubGlobal('Blob', TestBlob);
    userApiMocks.createInvite.mockResolvedValueOnce({ token: 'async-token' });
    const { result } = renderHook(() => useInviteLink());

    await act(async () => {
      await result.current.copy();
    });

    const items = clipboardWrite.mock.calls[0][0] as TestClipboardItem[];
    const blob = await items[0].data['text/plain'];

    expect(items).toHaveLength(1);
    expect(blob).toBeInstanceOf(TestBlob);
    expect((blob as unknown as TestBlob).parts).toEqual([
      `${window.location.origin}/invite/async-token`,
    ]);
    expect((blob as unknown as TestBlob).options).toEqual({
      type: 'text/plain',
    });
    expect(clipboardWriteText).not.toHaveBeenCalled();
    expect(result.current.status).toBe('copied');
  });

  it('reports invite creation failures and later returns to idle', async () => {
    userApiMocks.createInvite.mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() => useInviteLink());

    await act(async () => {
      await result.current.copy();
    });

    expect(clipboardWriteText).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');

    await advance(2500);
    expect(result.current.status).toBe('idle');
  });

  it('reports clipboard write failures', async () => {
    userApiMocks.createInvite.mockResolvedValueOnce({ token: 'blocked' });
    clipboardWriteText.mockRejectedValueOnce(new Error('permission denied'));
    const { result } = renderHook(() => useInviteLink());

    await act(async () => {
      await result.current.copy();
    });

    expect(userApiMocks.createInvite).toHaveBeenCalledOnce();
    expect(result.current.status).toBe('error');
  });

  it('restarts the reset delay when another link is copied', async () => {
    userApiMocks.createInvite
      .mockResolvedValueOnce({ token: 'first' })
      .mockResolvedValueOnce({ token: 'second' });
    const { result } = renderHook(() => useInviteLink());

    await act(async () => {
      await result.current.copy();
    });
    await advance(2000);
    await act(async () => {
      await result.current.copy();
    });
    await advance(500);

    expect(result.current.status).toBe('copied');
    expect(clipboardWriteText).toHaveBeenLastCalledWith(
      `${window.location.origin}/invite/second`,
    );

    await advance(2000);
    expect(result.current.status).toBe('idle');
  });

  it('clears its pending reset when the consumer unmounts', async () => {
    userApiMocks.createInvite.mockResolvedValueOnce({ token: 'temporary' });
    const { result, unmount } = renderHook(() => useInviteLink());

    await act(async () => {
      await result.current.copy();
    });

    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
