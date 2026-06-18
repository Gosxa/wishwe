'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotifications,
  getUnreadCount,
  readAllNotifications,
  type NotificationItem,
} from '@/shared/client_api/notifications';

// How often (ms) to poll the server for a new unread count when everything is working fine.
const POLL_INTERVAL = 60_000;
// Back-off delays after consecutive poll failures: 1 min; 2 min; 4 min; 5 min.
const ERROR_DELAYS = [60_000, 120_000, 240_000, 300_000] as const;
// Maximum number of notifications to show in the dropdown (most recent first).
const MAX_NOTIFICATIONS = 10;

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError';

const latestNotifications = (notifications: NotificationItem[]) =>
  [...notifications]
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    )
    .slice(0, MAX_NOTIFICATIONS);

export const useNotifications = (isOpen: boolean) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listRefresh, setListRefresh] = useState(0);

  const isOpenRef = useRef(isOpen);
  const unreadCountRef = useRef(unreadCount);
  const hasLoadedRef = useRef(false);
  const listControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | null = null;
    let disposed = false;
    let inFlight = false;
    let refreshAfterFlight = false;
    let consecutiveErrors = 0;
    let lastResumeRequest = Number.NEGATIVE_INFINITY;

    const isActive = () =>
      document.visibilityState === 'visible' && navigator.onLine;

    const clearTimer = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    const schedule = (delay: number) => {
      clearTimer();
      timer = setTimeout(() => {
        void poll();
      }, delay);
    };

    // One tick of the polling cycle. Fetches the unread count, updates state if it changed,
    // then schedules the next tick.
    const poll = async () => {
      clearTimer();

      // Skip if the component was unmounted or the tab is hidden / offline.
      if (disposed || !isActive()) return;

      // Another request is already running - set a flag so we re-poll immediately after it finishes.
      if (inFlight) {
        refreshAfterFlight = true;

        return;
      }

      inFlight = true;
      const requestController = new AbortController();

      controller = requestController;
      let nextDelay = POLL_INTERVAL;

      try {
        const nextCount = await getUnreadCount(requestController.signal);

        // Exit early if the component has been unmounted or the request was aborted during execution.
        if (disposed || requestController.signal.aborted) return;

        consecutiveErrors = 0;

        // Only re-render if the count actually changed.
        if (nextCount !== unreadCountRef.current) {
          unreadCountRef.current = nextCount;
          setUnreadCount(nextCount);

          // If the dropdown is already open, also refresh the notification list.
          if (isOpenRef.current) {
            setListRefresh(current => current + 1);
          }
        }
      } catch (requestError) {
        if (!isAbortError(requestError)) {
          // Network/server error - back off exponentially up to the last ERROR_DELAYS entry.
          consecutiveErrors += 1;
          nextDelay =
            ERROR_DELAYS[
              Math.min(consecutiveErrors - 1, ERROR_DELAYS.length - 1)
            ];
        }
      } finally {
        if (controller === requestController) {
          controller = null;
        }

        inFlight = false;

        if (disposed || !isActive()) return;

        // A poll was requested while we were in-flight - run it now instead of waiting.
        if (refreshAfterFlight) {
          refreshAfterFlight = false;
          void poll();

          return;
        }

        // Schedule the next tick
        schedule(nextDelay);
      }
    };

    const refreshImmediately = () => {
      if (!isActive()) return;

      const now = Date.now();

      if (now - lastResumeRequest < 250) return;
      lastResumeRequest = now;

      clearTimer();
      void poll();
    };

    const pause = () => {
      clearTimer();
      refreshAfterFlight = false;
      controller?.abort();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pause();
      } else {
        refreshImmediately();
      }
    };

    const handleOnline = () => refreshImmediately();
    const handleOffline = () => pause();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshImmediately);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void poll();

    return () => {
      disposed = true;
      clearTimer();
      controller?.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshImmediately);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isOpenRef.current) return;

    listControllerRef.current?.abort();
    const controller = new AbortController();

    listControllerRef.current = controller;

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }

    setError(null);

    try {
      const page = await getNotifications(controller.signal);
      const nextNotifications = latestNotifications(page.results);

      if (controller.signal.aborted || !isOpenRef.current) return;

      hasLoadedRef.current = true;
      setNotifications(nextNotifications);

      const shouldMarkAllRead =
        unreadCountRef.current > 0 ||
        nextNotifications.some(notification => !notification.is_read);

      if (shouldMarkAllRead) {
        await readAllNotifications(controller.signal);

        if (controller.signal.aborted) return;

        const readNotifications = nextNotifications.map(notification => ({
          ...notification,
          is_read: true,
        }));

        unreadCountRef.current = 0;
        setUnreadCount(0);
        setNotifications(readNotifications);
      }
    } catch (requestError) {
      if (!isAbortError(requestError)) {
        setError("We couldn't load notifications.");
      }
    } finally {
      if (listControllerRef.current === controller) {
        listControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      listControllerRef.current?.abort();

      return;
    }

    const fetchTimer = setTimeout(() => {
      void fetchNotifications();
    }, 0);

    return () => {
      clearTimeout(fetchTimer);
      listControllerRef.current?.abort();
    };
  }, [fetchNotifications, isOpen, listRefresh]);

  useEffect(() => {
    const abortListRequest = () => {
      listControllerRef.current?.abort();
    };

    const refreshOpenList = () => {
      if (
        isOpenRef.current &&
        document.visibilityState === 'visible' &&
        navigator.onLine
      ) {
        setListRefresh(current => current + 1);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        abortListRequest();
      } else {
        refreshOpenList();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', refreshOpenList);
    window.addEventListener('offline', abortListRequest);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', refreshOpenList);
      window.removeEventListener('offline', abortListRequest);
    };
  }, []);

  return {
    unreadCount,
    notifications,
    isLoading,
    error,
    retry: fetchNotifications,
  };
};
