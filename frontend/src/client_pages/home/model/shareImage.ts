import type { FeedEvent } from './types';
import { FALLBACK_FONT_SANS, FALLBACK_FONT_SERIF } from './shareImage/drawing';
import type { CanvasImage, FontFamilies } from './shareImage/drawing';
import { renderPoster } from './shareImage/renderPoster';
import { renderCard } from './shareImage/renderCard';
import { renderStory } from './shareImage/renderStory';

export { getShareDateParts } from './shareImage/drawing';

export const SHARE_FORMATS = [
  {
    id: 'poster',
    label: 'Poster',
    width: 1200,
    height: 630,
    description: 'link previews, X, Facebook',
  },
  {
    id: 'card',
    label: 'Card',
    width: 1200,
    height: 630,
    description: 'detail-forward',
  },
  {
    id: 'story',
    label: 'Story',
    width: 1080,
    height: 1920,
    description: 'Instagram Stories, WhatsApp status',
  },
] as const;

export type ShareFormat = (typeof SHARE_FORMATS)[number]['id'];

export type GeneratedShareImage = {
  format: ShareFormat;
  blob: Blob;
};

export type ShareDateParts = {
  date: string;
  time: string;
};

const loadImage = (source: string | null | undefined) => {
  if (!source) return Promise.resolve<CanvasImage>(null);

  return new Promise<CanvasImage>(resolve => {
    const image = new Image();

    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
};

const getFonts = async (): Promise<FontFamilies> => {
  await document.fonts?.ready;

  const styles = getComputedStyle(document.documentElement);
  const sans = styles.getPropertyValue('--font-sk-modernist').trim();
  const serif = styles.getPropertyValue('--font-instrument-serif').trim();

  return {
    sans: sans || FALLBACK_FONT_SANS,
    serif: serif || FALLBACK_FONT_SERIF,
  };
};

const canvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not render the share image.'));
      }
    }, 'image/png');
  });

const renderImage = async (
  format: ShareFormat,
  event: FeedEvent,
  cover: CanvasImage,
  avatar: CanvasImage,
  logo: CanvasImage,
  fonts: FontFamilies,
) => {
  const spec = SHARE_FORMATS.find(item => item.id === format);

  if (!spec) throw new Error(`Unsupported share format: ${format}`);

  const canvas = document.createElement('canvas');

  canvas.width = spec.width;
  canvas.height = spec.height;

  const context = canvas.getContext('2d');

  if (!context) throw new Error('Canvas rendering is not supported.');

  if (format === 'poster') {
    renderPoster(context, event, cover, avatar, fonts);
  } else if (format === 'card') {
    renderCard(context, event, cover, logo, fonts);
  } else {
    renderStory(context, event, cover, avatar, fonts);
  }

  return canvasBlob(canvas);
};

export const generateShareImages = async (
  event: FeedEvent,
): Promise<GeneratedShareImage[]> => {
  const [cover, avatar, logo, fonts] = await Promise.all([
    loadImage(event.image),
    loadImage(event.host.avatar),
    loadImage('/icon.svg'),
    getFonts(),
  ]);

  return Promise.all(
    SHARE_FORMATS.map(async spec => ({
      format: spec.id,
      blob: await renderImage(spec.id, event, cover, avatar, logo, fonts),
    })),
  );
};

export const shareImageFilename = (
  event: Pick<FeedEvent, 'id' | 'title'>,
  format: ShareFormat,
) => {
  const slug = event.title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `wishwe-${slug || `event-${event.id}`}-${format}.png`;
};
