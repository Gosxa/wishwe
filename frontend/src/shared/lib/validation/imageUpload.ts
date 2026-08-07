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

const ALLOWED_COVER_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.avif',
  '.heic',
  '.heif',
] as const;

export const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;

export const getCoverImageAcceptAttribute = (): string =>
  [...ALLOWED_COVER_IMAGE_TYPES, ...ALLOWED_COVER_IMAGE_EXTENSIONS].join(',');

export const isAllowedCoverImageType = (mimeType: string): boolean =>
  (ALLOWED_COVER_IMAGE_TYPES as readonly string[]).includes(mimeType);

export const isAllowedCoverImage = (
  file: Pick<File, 'name' | 'type'>,
): boolean =>
  isAllowedCoverImageType(file.type.toLowerCase()) ||
  ALLOWED_COVER_IMAGE_EXTENSIONS.some(extension =>
    file.name.toLowerCase().endsWith(extension),
  );
