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

  if (/^(https?:)?\/\//.test(value) || value.startsWith('data:')) return value;

  if (apiOrigin) return `${apiOrigin}/${value.replace(/^\/+/, '')}`;

  return value;
};
