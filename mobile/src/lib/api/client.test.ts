import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiRequest, apiRequestWithResponse } from '@/lib/api/client';

vi.mock('@/lib/api/config', () => ({
  API_URL: 'http://localhost:8000',
}));

vi.mock('@/lib/auth/session-store', () => ({
  getSession: vi.fn(() => null),
  saveAccessToken: vi.fn(),
  clearSession: vi.fn(),
}));

const originalFetch = globalThis.fetch;

describe('api client', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('parses and returns JSON responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const data = await apiRequest<{ ok: boolean }>('/api/test');
    expect(data).toEqual({ ok: true });
  });

  it('handles standard 204 No Content responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
        statusText: 'No Content',
      }),
    );

    const { data, response } = await apiRequestWithResponse('/api/test', {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
    expect(data).toBeNull();
  });

  it('recovers from Android OkHttp ProtocolException on 204 with non-zero Content-Length', async () => {
    const okHttpError = new Error(
      'fetch failed: java.net.ProtocolException: HTTP 204 had non-zero Content-Length: 20',
    );
    globalThis.fetch = vi.fn().mockRejectedValue(okHttpError);

    const { data, response } = await apiRequestWithResponse('/api/user/friendship/77/', {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
    expect(response.ok).toBe(true);
    expect(data).toBeNull();
  });

  it('throws ApiError when the server returns an error status', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ detail: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
    );

    await expect(apiRequest('/api/not-found')).rejects.toThrow(ApiError);
    await expect(apiRequest('/api/not-found')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    });
  });

  it('translates network aborts into a user-facing timeout error', async () => {
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    globalThis.fetch = vi.fn().mockRejectedValue(abortError);

    await expect(apiRequest('/api/timeout')).rejects.toMatchObject({
      status: 0,
      message: 'The request took too long. Please try again.',
    });
  });
});
