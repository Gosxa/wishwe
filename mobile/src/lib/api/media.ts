import { API_URL } from '@/lib/api/config';

const apiOrigin = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
})();

export function toAbsoluteMediaUrl(path: string | null | undefined): string | null {
  const value = path?.trim();

  if (!value) {
    return null;
  }

  if (/^(https?:)?\/\//.test(value) || value.startsWith('data:')) {
    return value;
  }

  if (apiOrigin) {
    return `${apiOrigin}/${value.replace(/^\/+/, '')}`;
  }

  return value;
}
