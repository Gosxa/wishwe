'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationCountStore } from '@/shared/store/useNotificationCountStore';
import {
  deleteNotification as deleteNotificationRequest,
  getNotifications,
  getUnreadCount,
  readAllNotifications,
  type NotificationItem,
} from '@/shared/client_api/notifications';
import { subscribeToNotificationSocket } from '@/shared/client_api/notifications/socket';

const MAX_NOTIFICATIONS = 10;

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
    useNotificationCountStore.getState().setUnreadCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    let disposed = false;

    const syncUnreadCount = () => {
      void getUnreadCount()
        .then(count => {
          if (disposed) return;
          unreadCountRef.current = count;
          setUnreadCount(count);
        })
        .catch(() => undefined);
    };

    const unsubscribe = subscribeToNotificationSocket(event => {
      if (event.type === 'connected') {
        syncUnreadCount();
        return;
      }

      if (!event.notification.is_read) {
        unreadCountRef.current += 1;
        setUnreadCount(unreadCountRef.current);
      }

      if (isOpenRef.current) {
        setListRefresh(current => current + 1);
      }
    });

    syncUnreadCount();

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isOpenRef.current) return;

    listControllerRef.current?.abort();
    const controller = new AbortController();
    listControllerRef.current = controller;

    if (!hasLoadedRef.current) setIsLoading(true);
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
    } catch {
      if (!controller.signal.aborted) {
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

    const fetchTimer = setTimeout(() => void fetchNotifications(), 0);
    return () => {
      clearTimeout(fetchTimer);
      listControllerRef.current?.abort();
    };
  }, [fetchNotifications, isOpen, listRefresh]);

  useEffect(() => {
    const abortListRequest = () => listControllerRef.current?.abort();
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

  const removeNotification = useCallback(async (id: number) => {
    try {
      await deleteNotificationRequest(id);
      const removedNotification = notifications.find(item => item.id === id);
      setNotifications(current => current.filter(item => item.id !== id));

      if (removedNotification && !removedNotification.is_read) {
        unreadCountRef.current = Math.max(0, unreadCountRef.current - 1);
        setUnreadCount(unreadCountRef.current);
      }
      setError(null);
    } catch {
      setError("We couldn't delete the notification.");
    }
  }, [notifications]);

  return {
    unreadCount,
    notifications,
    isLoading,
    error,
    retry: fetchNotifications,
    removeNotification,
  };
};
