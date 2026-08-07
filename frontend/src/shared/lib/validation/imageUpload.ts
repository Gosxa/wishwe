export const ALLOWED_COVER_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
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
  '.heic',
  '.heif',
] as const;

const HEIC_COVER_IMAGE_TYPES = [
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
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

const isHeicCoverImage = (file: Pick<File, 'name' | 'type'>): boolean => {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return (
    (HEIC_COVER_IMAGE_TYPES as readonly string[]).includes(mimeType) ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif')
  );
};

const getJpegFileName = (fileName: string): string => {
  const jpegFileName = fileName.replace(/\.(heic|heif)$/i, '.jpg');

  return jpegFileName === fileName ? `${fileName}.jpg` : jpegFileName;
};

export const prepareCoverImage = async (file: File): Promise<File> => {
  if (!isHeicCoverImage(file)) return file;

  const { heicTo } = await import('heic-to/csp');
  const jpeg = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.85,
  });

  return new File([jpeg], getJpegFileName(file.name), {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
};
