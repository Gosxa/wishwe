// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const imageMocks = vi.hoisted(() => ({
  isAllowedCoverImage: vi.fn(),
  prepareCoverImage: vi.fn(),
}));

vi.mock('@/shared/lib/validation/imageUpload', () => ({
  isAllowedCoverImage: imageMocks.isAllowedCoverImage,
  MAX_COVER_IMAGE_SIZE: 5 * 1024 * 1024,
  prepareCoverImage: imageMocks.prepareCoverImage,
}));

import { MAX_COVER_IMAGE_SIZE } from '@/shared/lib/validation/imageUpload';
import { useEventCover } from './useEventCover';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(promiseResolve => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
};

const imageFile = (name: string, size?: number) => {
  const file = new File(['image'], name, { type: 'image/png' });

  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }

  return file;
};

describe('useEventCover', () => {
  const createObjectURL = vi.fn<(object: Blob | MediaSource) => string>();
  const revokeObjectURL = vi.fn<(url: string) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    imageMocks.isAllowedCoverImage.mockReturnValue(true);
    imageMocks.prepareCoverImage.mockImplementation(async file => file);
    createObjectURL.mockImplementation(object =>
      object instanceof File ? `blob:${object.name}` : 'blob:media-source',
    );
    vi.stubGlobal('URL', URL);
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURL);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURL);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderCover = (initialPreviewUrl: string | null = null) =>
    renderHook(() => {
      const [error, setError] = useState<string>();

      return useEventCover({
        initialPreviewUrl,
        error,
        onErrorChange: setError,
      });
    });

  it('owns preview replacement and object URL cleanup', async () => {
    const { result, unmount } = renderCover('https://cdn.test/original.jpg');
    const first = imageFile('first.png');
    const second = imageFile('second.png');

    await act(async () => result.current.model.onSelect(first));

    expect(result.current.file).toBe(first);
    expect(result.current.model.previewUrl).toBe('blob:first.png');
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await act(async () => result.current.model.onSelect(second));

    expect(result.current.file).toBe(second);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first.png');

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:second.png');
    expect(revokeObjectURL).not.toHaveBeenCalledWith(
      'https://cdn.test/original.jpg',
    );
  });

  it('rejects invalid files before conversion', async () => {
    const { result } = renderCover();
    const oversized = imageFile('large.png', MAX_COVER_IMAGE_SIZE + 1);

    await act(async () => result.current.model.onSelect(oversized));

    expect(result.current.file).toBeNull();
    expect(result.current.model.error).toBe('Image must be 5 MB or less');
    expect(result.current.model.isProcessing).toBe(false);
    expect(imageMocks.prepareCoverImage).not.toHaveBeenCalled();
  });

  it('keeps only the latest asynchronous selection', async () => {
    const firstPreparation = deferred<File>();
    const secondPreparation = deferred<File>();
    const first = imageFile('first.png');
    const second = imageFile('second.png');

    imageMocks.prepareCoverImage
      .mockReturnValueOnce(firstPreparation.promise)
      .mockReturnValueOnce(secondPreparation.promise);

    const { result } = renderCover();

    act(() => {
      void result.current.model.onSelect(first);
    });
    act(() => {
      void result.current.model.onSelect(second);
    });

    await act(async () => secondPreparation.resolve(second));

    expect(result.current.file).toBe(second);
    expect(result.current.model.previewUrl).toBe('blob:second.png');

    await act(async () => firstPreparation.resolve(first));

    expect(result.current.file).toBe(second);
    expect(result.current.model.previewUrl).toBe('blob:second.png');
    expect(createObjectURL).toHaveBeenCalledOnce();
  });

  it('ignores a preparation result after unmount', async () => {
    const preparation = deferred<File>();
    const selected = imageFile('late.png');

    imageMocks.prepareCoverImage.mockReturnValueOnce(preparation.promise);

    const { result, unmount } = renderCover();

    act(() => {
      void result.current.model.onSelect(selected);
    });
    unmount();
    await act(async () => preparation.resolve(selected));

    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
