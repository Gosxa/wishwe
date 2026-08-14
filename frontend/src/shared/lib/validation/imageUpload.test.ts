// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const heicMocks = vi.hoisted(() => ({
  heicTo: vi.fn(),
}));

vi.mock('heic-to/csp', () => ({
  heicTo: heicMocks.heicTo,
}));

import {
  ALLOWED_COVER_IMAGE_TYPES,
  getCoverImageAcceptAttribute,
  isAllowedCoverImage,
  isAllowedCoverImageType,
  MAX_COVER_IMAGE_SIZE,
  prepareCoverImage,
} from './imageUpload';

describe('cover image validation', () => {
  it('publishes the browser accept value for every supported MIME and extension', () => {
    expect(getCoverImageAcceptAttribute().split(',')).toEqual([
      ...ALLOWED_COVER_IMAGE_TYPES,
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.heic',
      '.heif',
    ]);
  });

  it.each(ALLOWED_COVER_IMAGE_TYPES)(
    'accepts the supported MIME type %s',
    mimeType => {
      expect(isAllowedCoverImageType(mimeType)).toBe(true);
      expect(isAllowedCoverImage({ name: 'upload.bin', type: mimeType })).toBe(
        true,
      );
    },
  );

  it.each(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])(
    'uses a case-insensitive .%s extension when MIME metadata is missing',
    extension => {
      expect(
        isAllowedCoverImage({
          name: `HOLIDAY.${extension.toUpperCase()}`,
          type: '',
        }),
      ).toBe(true);
    },
  );

  it('normalizes MIME case and allows a trusted MIME with an unknown extension', () => {
    expect(
      isAllowedCoverImage({ name: 'camera-upload.bin', type: 'IMAGE/PNG' }),
    ).toBe(true);
  });

  it.each([
    { name: 'animation.gif', type: 'image/gif' },
    { name: 'photo.jpg.exe', type: '' },
    { name: 'photo', type: 'application/octet-stream' },
  ])('rejects an unsupported file: $name', file => {
    expect(isAllowedCoverImage(file)).toBe(false);
  });

  it('defines the inclusive five-megabyte selection boundary', () => {
    expect(MAX_COVER_IMAGE_SIZE).toBe(5 * 1024 * 1024);
  });
});

describe('prepareCoverImage', () => {
  beforeEach(() => {
    heicMocks.heicTo.mockReset();
  });

  it('returns non-HEIC files unchanged without loading the converter', async () => {
    const png = new File(['png'], 'cover.png', {
      type: 'image/png',
      lastModified: 123,
    });

    await expect(prepareCoverImage(png)).resolves.toBe(png);
    expect(heicMocks.heicTo).not.toHaveBeenCalled();
  });

  it('converts an extension-detected HEIC to a JPEG and preserves metadata', async () => {
    const source = new File(['heic'], 'SUMMER.HEIC', {
      type: '',
      lastModified: 1_725_000_000_000,
    });
    const convertedBlob = new Blob(['jpeg-result'], { type: 'image/jpeg' });

    heicMocks.heicTo.mockResolvedValue(convertedBlob);

    const result = await prepareCoverImage(source);

    expect(heicMocks.heicTo).toHaveBeenCalledWith({
      blob: source,
      type: 'image/jpeg',
      quality: 0.85,
    });
    expect(result).not.toBe(source);
    expect(result.name).toBe('SUMMER.jpg');
    expect(result.type).toBe('image/jpeg');
    expect(result.lastModified).toBe(source.lastModified);
    expect(result.size).toBe(convertedBlob.size);
  });

  it('converts a MIME-detected HEIC and appends a JPEG extension', async () => {
    const source = new File(['heic'], 'camera-upload.bin', {
      type: 'image/heic-sequence',
    });

    heicMocks.heicTo.mockResolvedValue(
      new Blob(['jpeg-result'], { type: 'image/jpeg' }),
    );

    const result = await prepareCoverImage(source);

    expect(result.name).toBe('camera-upload.bin.jpg');
    expect(result.type).toBe('image/jpeg');
  });

  it('propagates conversion failures to the upload workflow', async () => {
    const source = new File(['broken'], 'broken.heif', {
      type: 'image/heif',
    });
    const error = new Error('HEIC decoder failed');

    heicMocks.heicTo.mockRejectedValue(error);

    await expect(prepareCoverImage(source)).rejects.toBe(error);
  });
});
