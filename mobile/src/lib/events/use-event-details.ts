import { useCallback, useEffect, useState } from 'react';

import { getEvent, listParticipants } from '@/lib/api/events';
import { handle, toFeedEvent } from '@/lib/events/mapper';
import { toAbsoluteMediaUrl } from '@/lib/api/media';
import type { FeedEvent } from '@/lib/events/types';

type Snapshot = {
  key: string;
  event: FeedEvent | null;
  error: string | null;
};

export function useEventDetails(id: string) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [attempt, setAttempt] = useState(0);

  const key = `${id}|${attempt}`;
  const isCurrent = snapshot?.key === key;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const detail = toFeedEvent(await getEvent(id));

        if (cancelled) return;

        setSnapshot({ key, event: detail, error: null });

        const participants = await listParticipants(id).catch(() => null);

        if (!participants || cancelled) return;

        setSnapshot((current) =>
          current?.key === key && current.event
            ? {
                ...current,
                event: {
                  ...current.event,
                  participants: participants.map((participant) => ({
                    username: handle(participant.username),
                    avatar: toAbsoluteMediaUrl(participant.avatar),
                  })),
                },
              }
            : current,
        );
      } catch {
        if (cancelled) return;

        setSnapshot({ key, event: null, error: 'Failed to load this event' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, key]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const applyEvent = useCallback(
    (next: FeedEvent) => {
      setSnapshot((current) => {
        if (current?.key !== key) return current;

        const participants =
          next.participants.length === 0 && current.event
            ? current.event.participants
            : next.participants;

        return { ...current, event: { ...next, participants }, error: null };
      });
    },
    [key],
  );

  return {
    event: isCurrent ? snapshot.event : null,
    isLoading: !isCurrent,
    error: isCurrent ? snapshot.error : null,
    retry,
    applyEvent,
  };
}
