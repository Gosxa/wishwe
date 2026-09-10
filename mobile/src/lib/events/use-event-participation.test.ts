import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { participationErrorMessage } from '@/lib/events/use-event-participation';

vi.mock('@/lib/api/config', () => ({
  API_URL: 'http://localhost:8000',
}));

vi.mock('@/lib/auth/session-store', () => ({
  getSession: vi.fn(() => null),
  saveAccessToken: vi.fn(),
  clearSession: vi.fn(),
}));

describe('participationErrorMessage', () => {
  it('reports what the server rejected instead of the generic message', () => {
    const error = new ApiError('User already left this event.', 400);

    expect(participationErrorMessage(error, 'Could not leave this event.')).toBe(
      'User already left this event.',
    );
  });

  it('reports transport failures, which are not about the action', () => {
    const error = new ApiError('The request took too long. Please try again.', 0);

    expect(participationErrorMessage(error, 'Could not join this event.')).toBe(
      'The request took too long. Please try again.',
    );
  });

  it('falls back to the action message for unknown failures', () => {
    expect(participationErrorMessage(new TypeError('boom'), 'Could not join this event.')).toBe(
      'Could not join this event.',
    );
  });
});
