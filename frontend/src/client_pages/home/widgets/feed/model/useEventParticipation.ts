'use client';

import { useState } from 'react';
import {
  expressInterest,
  joinPlan,
  leaveEvent,
} from '@/shared/client_api/event';
import { toFeedEvents } from '@client_pages/home/model/feedMapper';
import type { FeedEvent } from '@client_pages/home/model/types';

export const useEventParticipation = (event: FeedEvent) => {
  const [status, setStatus] = useState(event.userParticipationStatus);
  const [count, setCount] = useState(event.participantCount);
  const [participants, setParticipants] = useState(event.participants);
  const [isPending, setIsPending] = useState(false);
  const [previousEvent, setPreviousEvent] = useState(event);

  if (event !== previousEvent) {
    setPreviousEvent(event);
    setStatus(event.userParticipationStatus);
    setCount(event.participantCount);
    setParticipants(event.participants);
  }

  const applyResponse = (response: ReturnType<typeof toFeedEvents>[number]) => {
    setStatus(response.userParticipationStatus);
    setCount(response.participantCount);
    setParticipants(response.participants);
  };

  const join = async (): Promise<boolean> => {
    setIsPending(true);

    try {
      const response =
        event.type === 'plan'
          ? await joinPlan(event.id)
          : await expressInterest(event.id);

      applyResponse(toFeedEvents([response])[0]);

      return true;
    } catch {
      // keep the current participation state when the request fails
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const leave = async (): Promise<boolean> => {
    setIsPending(true);

    try {
      const response = await leaveEvent(event.id);

      applyResponse(toFeedEvents([response])[0]);

      return true;
    } catch {
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const isParticipating = status !== null;

  return {
    count,
    participants,
    isPending,
    isParticipating,
    actionLabel: event.type === 'plan' ? 'Join' : 'Interested',
    selectedLabel: event.type === 'plan' ? 'Joined' : 'Interested',
    join,
    leave,
  };
};

export type EventParticipation = ReturnType<typeof useEventParticipation>;
