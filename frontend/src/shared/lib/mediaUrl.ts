const apiOrigin = (() => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

  try {
    return base ? new URL(base).origin : '';
  } catch {
    return '';
  }
})();

export const toAbsoluteMediaUrl = (
  path: string | null | undefined,
): string | null => {
  const value = path?.trim();

  if (!value) return null;

  if (/^(https?:)?\/\//.test(value)) {
    if (!apiOrigin) return value;

    try {
      const url = new URL(value, apiOrigin);
      const isMediaPath = url.pathname.startsWith('/media/');
      const isInternalHost =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        !url.hostname.includes('.') ||
        url.hostname.endsWith('.internal') ||
        url.hostname.endsWith('.local');

      if (isMediaPath && isInternalHost && url.origin !== apiOrigin) {
        return `${apiOrigin}${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return value;
    }

    return value;
  }

  if (/^(data|blob):/.test(value)) return value;

  if (apiOrigin) return `${apiOrigin}/${value.replace(/^\/+/, '')}`;

  return value;
};
