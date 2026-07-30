export const NEXT_PARAM = 'next';

export const PATHNAME_HEADER = 'x-pathname';

export const USER_ID_HEADER = 'x-user-id';

const ORIGIN = 'http://localhost';

const BLOCKED_PREFIXES = ['/onboard', '/api', '/next_api'];

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
