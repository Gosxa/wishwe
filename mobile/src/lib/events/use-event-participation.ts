import { useCallback, useState } from 'react';

import { ApiError } from '@/lib/api/client';
import { expressInterest, joinPlan, leaveEvent } from '@/lib/api/events';
import { toFeedEvent } from '@/lib/events/mapper';
import type { FeedEvent } from '@/lib/events/types';

type Options = {
  onChange?: (event: FeedEvent) => void;
};

export function participationErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}

export function useEventParticipation(event: FeedEvent, { onChange }: Options = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (request: () => Promise<Awaited<ReturnType<typeof joinPlan>>>, message: string) => {
      setIsPending(true);
      setError(null);

      try {
        onChange?.(toFeedEvent(await request()));

        return true;
      } catch (error) {
        setError(participationErrorMessage(error, message));

        return false;
      } finally {
        setIsPending(false);
      }
    },
    [onChange],
  );

  const join = useCallback(
    () =>
      run(
        () => (event.type === 'plan' ? joinPlan(event.id) : expressInterest(event.id)),
        event.type === 'plan'
          ? 'Could not join this event. Please try again.'
          : 'Could not save your interest. Please try again.',
      ),
    [event.id, event.type, run],
  );

  const leave = useCallback(
    () => run(() => leaveEvent(event.id), 'Could not leave this event. Please try again.'),
    [event.id, run],
  );

  return {
    isPending,
    error,
    clearError: useCallback(() => setError(null), []),
    isParticipating: event.userParticipationStatus !== null,
    actionLabel: event.type === 'plan' ? 'Join' : 'Interested',
    selectedLabel: event.type === 'plan' ? 'Joined' : 'Interested',
    join,
    leave,
  };
}

export type EventParticipation = ReturnType<typeof useEventParticipation>;
