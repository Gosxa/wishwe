type HeadersWithSetCookie = Headers & { getSetCookie?: () => string[] };

/** Returns every `Set-Cookie` value of a response as one string. */
export function readSetCookieHeader(response: Response): string {
  const headers = response.headers as HeadersWithSetCookie;

  if (typeof headers.getSetCookie === 'function') {
    const values = headers.getSetCookie();
    if (values.length > 0) {
      return values.join(', ');
    }
  }

  return headers.get('set-cookie') ?? '';
}

/**
 * Picks one cookie value out of a raw `Set-Cookie` string.
 */
export function readCookie(rawSetCookie: string, name: string): string | null {
  const match = rawSetCookie.match(new RegExp(`(?:^|[,;]\\s*)${name}=([^;,\\s]+)`));
  const value = match?.[1];

  return !value || value === '""' ? null : value;
}
