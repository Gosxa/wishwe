import type { GeneratedShareImage, ShareFormat } from './shareImage';

export type ShareFeedback = 'idle' | 'link' | 'image';
export type ShareNetwork = 'telegram' | 'whatsapp' | 'x' | 'facebook';
export type PreparedShareImage = GeneratedShareImage & { url: string };
export type SocialShareUrls = Record<ShareNetwork, string>;

const FORMAT_STORAGE_KEY = 'wishwe-share-format';
const SKIP_INSTAGRAM_NOTICE_KEY = 'wishwe-skip-instagram-notice';

const currentOriginLink = (path: string) => {
  if (typeof window === 'undefined') return path;

  return `${window.location.origin}${path}`;
};

export const fallbackShareLink = (eventId: string) =>
  currentOriginLink(`/feed?event=${eventId}`);

export const toCurrentOrigin = (shareUrl: string) => {
  try {
    return currentOriginLink(new URL(shareUrl).pathname);
  } catch {
    return shareUrl;
  }
};

export const readStoredShareFormat = (): ShareFormat => {
  if (typeof window === 'undefined') return 'poster';

  try {
    const stored = window.sessionStorage.getItem(FORMAT_STORAGE_KEY);

    return stored === 'poster' || stored === 'card' || stored === 'story'
      ? stored
      : 'poster';
  } catch {
    return 'poster';
  }
};

export const storeShareFormat = (format: ShareFormat) => {
  try {
    window.sessionStorage.setItem(FORMAT_STORAGE_KEY, format);
  } catch {}
};

export const readSkipInstagramNotice = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(SKIP_INSTAGRAM_NOTICE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const saveSkipInstagramNotice = (skip: boolean) => {
  if (typeof window === 'undefined') return;

  try {
    if (skip) {
      window.localStorage.setItem(SKIP_INSTAGRAM_NOTICE_KEY, 'true');
    } else {
      window.localStorage.removeItem(SKIP_INSTAGRAM_NOTICE_KEY);
    }
  } catch {}
};

export const supportsImageClipboard = () => {
  if (
    typeof ClipboardItem === 'undefined' ||
    typeof navigator.clipboard?.write !== 'function'
  ) {
    return false;
  }

  const clipboardItem = ClipboardItem as typeof ClipboardItem & {
    supports?: (type: string) => boolean;
  };

  return clipboardItem.supports?.('image/png') ?? true;
};

export const copyShareLink = async (linkPromise: Promise<string>) => {
  if (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'
  ) {
    const item = new ClipboardItem({
      'text/plain': linkPromise.then(
        link => new Blob([link], { type: 'text/plain' }),
      ),
    });

    await navigator.clipboard.write([item]);

    return;
  }

  await navigator.clipboard.writeText(await linkPromise);
};

const socialShareUrl = (network: ShareNetwork, link: string, title: string) => {
  const urls: Record<ShareNetwork, URL> = {
    telegram: new URL('https://t.me/share/url'),
    whatsapp: new URL('https://wa.me/'),
    x: new URL('https://x.com/intent/post'),
    facebook: new URL('https://www.facebook.com/sharer/sharer.php'),
  };
  const url = urls[network];

  if (network === 'telegram') {
    url.searchParams.set('url', link);
    url.searchParams.set('text', title);
  } else if (network === 'whatsapp') {
    url.searchParams.set('text', `${title} ${link}`);
  } else if (network === 'x') {
    url.searchParams.set('text', title);
    url.searchParams.set('url', link);
  } else {
    url.searchParams.set('u', link);
  }

  return url.toString();
};

export const buildSocialShareUrls = (
  link: string,
  title: string,
): SocialShareUrls => ({
  telegram: socialShareUrl('telegram', link, title),
  whatsapp: socialShareUrl('whatsapp', link, title),
  x: socialShareUrl('x', link, title),
  facebook: socialShareUrl('facebook', link, title),
});

export const findShareImage = (
  images: PreparedShareImage[] | null,
  format: ShareFormat,
) => images?.find(image => image.format === format) ?? null;
