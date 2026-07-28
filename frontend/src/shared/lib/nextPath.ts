export const NEXT_PARAM = 'next';

export const PATHNAME_HEADER = 'x-pathname';

const ORIGIN = 'http://localhost';

const BLOCKED_PREFIXES = ['/onboard', '/api', '/next_api'];

// Makes a redirect target safe: only same-site paths, not APIs or another site.
export const safeNextPath = (
  value: string | null | undefined,
): string | null => {
  if (!value || !value.startsWith('/')) return null;

  let url: URL;

  try {
    url = new URL(value, ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== ORIGIN) return null;

  const isBlocked = BLOCKED_PREFIXES.some(
    prefix => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );

  if (isBlocked) return null;

  return `${url.pathname}${url.search}`;
};
