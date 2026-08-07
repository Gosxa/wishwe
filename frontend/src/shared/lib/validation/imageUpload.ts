export const ALLOWED_COVER_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
] as const;

export const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;

export const getCoverImageAcceptAttribute = (): string =>
  ALLOWED_COVER_IMAGE_TYPES.join(',');

export const isAllowedCoverImageType = (mimeType: string): boolean =>
  (ALLOWED_COVER_IMAGE_TYPES as readonly string[]).includes(mimeType);
