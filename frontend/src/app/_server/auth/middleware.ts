import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';
import {
  NEXT_PARAM,
  PATHNAME_HEADER,
  USER_ID_HEADER,
  safeNextPath,
} from '@/shared/lib/nextPath';

const requestedPath = (request: NextRequest) =>
  safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);

const isJsonRequest = (request: NextRequest) => {
  // Soft navigations are still page loads; they must keep the 307 redirect.
  if (
    request.headers.has('rsc') ||
    request.headers.has('next-router-state-tree')
  ) {
    return false;
  }

  const pathname = request.nextUrl.pathname;
  const accept = request.headers.get('accept') ?? '';
  const fetchMode = request.headers.get('sec-fetch-mode');
  const fetchDest = request.headers.get('sec-fetch-dest');

  return (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    accept.includes('application/json') ||
    fetchMode === 'cors' ||
    fetchDest === 'empty'
  );
};

const redirectToOnboard = (request: NextRequest) => {
  if (isJsonRequest(request)) {
    return NextResponse.json(
      { detail: 'Authentication required' },
      { status: 401 },
    );
  }

  const url = new URL('/onboard', request.url);
  const next = requestedPath(request);

  if (next) url.searchParams.set(NEXT_PARAM, next);

  return NextResponse.redirect(url);
};

const forward = (
  request: NextRequest,
  options?: { cookieHeader?: string; userId?: string },
) => {
  const headers = new Headers(request.headers);
  const next = requestedPath(request);

  if (options?.cookieHeader) headers.set('cookie', options.cookieHeader);

  if (next) headers.set(PATHNAME_HEADER, next);
  else headers.delete(PATHNAME_HEADER);

  if (options?.userId) headers.set(USER_ID_HEADER, options.userId);
  else headers.delete(USER_ID_HEADER);

  return NextResponse.next({ request: { headers } });
};

const attempt = async (
  send: () => Promise<Response>,
): Promise<Response | null> => {
  try {
    return await send();
  } catch {
    return null;
  }
};

const sessionIdFrom = async (meRes: Response): Promise<string | undefined> => {
  try {
    const { user_id: userId } = (await meRes.json()) as { user_id?: number };

    return typeof userId === 'number' ? String(userId) : undefined;
  } catch {
    return undefined;
  }
};

const parseSetCookie = (setCookie: string): [string, string] => {
  const pair = setCookie.split(';')[0];
  const idx = pair.indexOf('=');

  return [pair.slice(0, idx).trim(), pair.slice(idx + 1).trim()];
};

const mergeCookieHeader = (
  cookieHeader: string,
  setCookies: string[],
): string => {
  const jar = new Map<string, string>();

  cookieHeader
    .split(';')
    .map(c => c.trim())
    .filter(Boolean)
    .forEach(c => {
      const idx = c.indexOf('=');

      jar.set(c.slice(0, idx).trim(), c.slice(idx + 1).trim());
    });

  setCookies.forEach(sc => {
    const [name, value] = parseSetCookie(sc);

    jar.set(name, value);
  });

  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
};

export async function authMiddleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const isPublicRoot = request.nextUrl.pathname === '/';
  const rejectRequest = () =>
    isPublicRoot ? forward(request) : redirectToOnboard(request);

  const acceptRequest = (options?: {
    cookieHeader?: string;
    userId?: string;
  }) =>
    isPublicRoot
      ? NextResponse.redirect(new URL('/feed', request.url))
      : forward(request, options);

  const cookieHeader = request.headers.get('cookie') ?? '';

  if (accessToken) {
    const meRes = await attempt(() => beApi.user.me(cookieHeader));

    if (meRes?.ok) {
      return acceptRequest({ userId: await sessionIdFrom(meRes) });
    }
  }

  if (!refreshToken) return rejectRequest();

  const refreshRes = await attempt(() => beApi.auth.refreshToken(cookieHeader));

  if (!refreshRes?.ok) return rejectRequest();

  const setCookies = refreshRes.headers.getSetCookie();

  if (setCookies.length === 0) return rejectRequest();

  const updatedCookieHeader = mergeCookieHeader(cookieHeader, setCookies);

  const retryRes = await attempt(() => beApi.user.me(updatedCookieHeader));

  if (!retryRes?.ok) return rejectRequest();

  const response = acceptRequest({
    cookieHeader: updatedCookieHeader,
    userId: await sessionIdFrom(retryRes),
  });

  setCookies.forEach(c => response.headers.append('set-cookie', c));

  return response;
}
