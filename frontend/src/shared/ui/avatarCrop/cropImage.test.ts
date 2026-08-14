// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cropImage } from './cropImage';

type ImageBehavior = 'load' | 'error';

const installImageMock = (behavior: ImageBehavior) => {
  class MockImage {
    onload: (() => void) | null = null;

    onerror: (() => void) | null = null;

    private source = '';

    get src() {
      return this.source;
    }

    set src(value: string) {
      this.source = value;

      if (behavior === 'load') {
        this.onload?.();
      } else {
        this.onerror?.();
      }
    }
  }

  vi.stubGlobal('Image', MockImage);
};

describe('cropImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('draws the selected pixels to a correctly sized JPEG canvas', async () => {
    installImageMock('load');
    const drawImage = vi.fn();
    const context = { drawImage } as unknown as CanvasRenderingContext2D;
    const createElement = vi.spyOn(document, 'createElement');

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context,
    );
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/jpeg;base64,cropped');
    const crop = { x: 12, y: 18, width: 160, height: 90 };

    await expect(cropImage('blob:avatar-source', crop)).resolves.toBe(
      'data:image/jpeg;base64,cropped',
    );

    const canvas = createElement.mock.results[0]?.value as HTMLCanvasElement;

    expect(canvas.width).toBe(160);
    expect(canvas.height).toBe(90);
    expect(drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: 'blob:avatar-source' }),
      12,
      18,
      160,
      90,
      0,
      0,
      160,
      90,
    );
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.9);
  });

  it('rejects an image-load failure before creating a canvas', async () => {
    installImageMock('error');
    const createElement = vi.spyOn(document, 'createElement');

    await expect(
      cropImage('blob:missing-avatar', { x: 0, y: 0, width: 20, height: 20 }),
    ).rejects.toThrow('Failed to load image');
    expect(createElement).not.toHaveBeenCalled();
  });

  it('rejects when the browser cannot provide a 2D canvas context', async () => {
    installImageMock('load');

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');

    await expect(
      cropImage('blob:avatar-source', {
        x: 0,
        y: 0,
        width: 20,
        height: 20,
      }),
    ).rejects.toThrow('Canvas context is unavailable');
    expect(toDataURL).not.toHaveBeenCalled();
  });
});
