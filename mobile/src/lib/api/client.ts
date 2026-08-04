import { API_URL } from '@/lib/api/config';
import { readCookie, readSetCookieHeader } from '@/lib/api/cookies';
import { clearSession, getSession, saveAccessToken } from '@/lib/auth/session-store';

export class ApiError extends Error {
  status: number;
  /** The underlying failure, when the request never reached the server. */
  cause?: unknown;

  constructor(message: string, status: number, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.cause = cause;
  }
}

type JsonBody = Record<string, unknown>;
type RequestBody = JsonBody | FormData;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: RequestBody;
  /** Send the stored access token, and retry once after refreshing it. */
  auth?: boolean;
  timeoutMs?: number;
};

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') {
    return fallback;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.error === 'string') {
    return record.error;
  }

  if (typeof record.detail === 'string') {
    return record.detail;
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
    if (typeof value === 'string') {
      return value;
    }
  }

  return fallback;
}

const REQUEST_TIMEOUT_MS = 10_000;
const OFFLINE_MESSAGE = 'Service temporarily unavailable';

async function send(
  path: string,
  method: string,
  body?: RequestBody,
  headers?: Record<string, string>,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const isMultipart = body instanceof FormData;

  try {
    return await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !isMultipart ? { 'Content-Type': 'application/json' } : null),
        ...headers,
      },
      body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn(`[api] ${method} ${path} failed before reaching the server:`, error);
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The request took too long. Please try again.', 0, error);
    }

    const reason = error instanceof Error ? error.message : String(error);

    throw new ApiError(__DEV__ ? `${OFFLINE_MESSAGE} — ${reason}` : OFFLINE_MESSAGE, 0, error);
  } finally {
    clearTimeout(timeout);
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Swaps the refresh token for a new access token.
 */
async function refreshAccessToken(): Promise<boolean> {
  const refresh = getSession()?.refresh;

  if (!refresh) {
    return false;
  }

  refreshInFlight ??= (async () => {
    try {
      const response = await send('/api/user/auth/token/refresh/', 'POST', undefined, {
        Cookie: `refresh_token=${refresh}`,
      });

      if (!response.ok) {
        return false;
      }

      const access = readCookie(readSetCookieHeader(response), 'access_token');

      if (!access) {
        return false;
      }

      await saveAccessToken(access, refresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequestWithResponse<T>(
  path: string,
  { method = 'GET', body, auth = false, timeoutMs }: RequestOptions = {},
): Promise<{ data: T; response: Response }> {
  const run = () => {
    const accessToken = auth ? getSession()?.access : undefined;

    return send(
      path,
      method,
      body,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      timeoutMs,
    );
  };

  let response = await run();

  if (auth && response.status === 401) {
    if (await refreshAccessToken()) {
      response = await run();
    } else {
      await clearSession();
    }
  }

  const data = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(messageFromBody(data, OFFLINE_MESSAGE), response.status);
  }

  return { data: data as T, response };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await apiRequestWithResponse<T>(path, options);

  return data;
}
