import { API_URL } from '@/lib/api/config';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type JsonBody = Record<string, unknown>;

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

export async function postJson<T>(path: string, body: JsonBody): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('Service temporarily unavailable', 0);
  } finally {
    clearTimeout(timeout);
  }

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(messageFromBody(data, 'Service temporarily unavailable'), response.status);
  }

  return data as T;
}
