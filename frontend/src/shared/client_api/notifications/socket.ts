import type { NotificationItem } from './types';

type SocketEvent =
  | { type: 'connected' }
  | { type: 'notification'; notification: NotificationItem };
type Listener = (event: SocketEvent) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let eventFeedSocket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let eventFeedReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let feedChangeTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let eventFeedReconnectAttempts = 0;
let isConnecting = false;
let isEventFeedConnecting = false;
let notificationGeneration = 0;
let eventFeedGeneration = 0;
let audio: HTMLAudioElement | null = null;
let audioUnlockAttached = false;

const getAudio = () => {
  if (typeof Audio === 'undefined') return null;

  audio ??= new Audio('/audio/notification.mp3');
  audio.preload = 'auto';
  return audio;
};

const unlockAudio = () => {
  const player = getAudio();
  if (!player) return;

  player.muted = true;
  void player
    .play()
    .then(() => {
      player.pause();
      player.currentTime = 0;
      player.muted = false;
    })
    .catch(() => {
      player.muted = false;
    });

  document.removeEventListener('pointerdown', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
  audioUnlockAttached = false;
};

const playNotificationSound = () => {
  const player = getAudio();
  if (!player) return;

  player.currentTime = 0;
  void player.play().catch(() => {
    // Browsers can block sound until the user has interacted with the page.
  });
};

const dispatchFeedChanged = () => {
  if (feedChangeTimer) clearTimeout(feedChangeTimer);

  feedChangeTimer = setTimeout(() => {
    feedChangeTimer = null;
    window.dispatchEvent(new Event('wishwe:feed-changed'));
  }, 200);
};

const getSocketBase = () => {
  if (typeof window === 'undefined') return '';

  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    try {
      const backend = new URL(backendUrl, window.location.origin);
      const protocol = backend.protocol === 'https:' ? 'wss:' : 'ws:';

      return `${protocol}//${backend.host}`;
    } catch {
      // Fall back to same-origin when the backend URL is not absolute.
    }
  }

  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
    window.location.host
  }`;
};

const createTicketedSocket = async (path: string) => {
  const response = await fetch('/api/user/ws-ticket', {
    method: 'POST',
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('Could not authorize WebSocket');

  const payload: unknown = await response.json();
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('ticket' in payload) ||
    typeof payload.ticket !== 'string'
  ) {
    throw new Error('Invalid WebSocket authorization response');
  }

  const encodedTicket = btoa(payload.ticket)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return new WebSocket(`${getSocketBase()}${path}`, [
    'wishwe.v1',
    `wishwe-auth.${encodedTicket}`,
  ]);
};

const scheduleNotificationReconnect = () => {
  if (listeners.size === 0 || reconnectTimer) return;

  const delay = Math.min(1000 * 2 ** reconnectAttempts, 30_000);
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
};

const connect = () => {
  if (
    typeof window === 'undefined' ||
    !('WebSocket' in window) ||
    socket?.readyState === WebSocket.OPEN ||
    socket?.readyState === WebSocket.CONNECTING ||
    isConnecting
  ) {
    return;
  }

  isConnecting = true;
  const generation = notificationGeneration;
  void createTicketedSocket('/ws/notifications/')
    .then(currentSocket => {
      if (
        listeners.size === 0 ||
        generation !== notificationGeneration
      ) {
        if (generation === notificationGeneration) {
          isConnecting = false;
        }
        currentSocket.close();
        return;
      }

      socket = currentSocket;
      currentSocket.onopen = () => {
        if (socket !== currentSocket) {
          currentSocket.close();
          return;
        }

        isConnecting = false;
        reconnectAttempts = 0;
        listeners.forEach(listener => listener({ type: 'connected' }));
      };

      currentSocket.onmessage = message => {
        try {
          const notification = JSON.parse(message.data) as NotificationItem;
          playNotificationSound();
          if (notification.type === 'friend_request') {
            window.dispatchEvent(new Event('wishwe:friend-request'));
          }
          window.dispatchEvent(
            new CustomEvent('wishwe:notification', {
              detail: notification,
            }),
          );
          listeners.forEach(listener =>
            listener({ type: 'notification', notification }),
          );
        } catch {
          // Ignore malformed frames and keep the connection available.
        }
      };

      currentSocket.onclose = () => {
        if (socket !== currentSocket) return;
        isConnecting = false;
        socket = null;
        scheduleNotificationReconnect();
      };

      currentSocket.onerror = () => currentSocket.close();
    })
    .catch(() => {
      if (generation !== notificationGeneration) return;

      isConnecting = false;
      scheduleNotificationReconnect();
    });
};

const scheduleEventFeedReconnect = () => {
  if (listeners.size === 0 || eventFeedReconnectTimer) return;

  const delay = Math.min(1000 * 2 ** eventFeedReconnectAttempts, 30_000);
  eventFeedReconnectAttempts += 1;
  eventFeedReconnectTimer = setTimeout(() => {
    eventFeedReconnectTimer = null;
    connectEventFeed();
  }, delay);
};

const connectEventFeed = () => {
  if (
    typeof window === 'undefined' ||
    !('WebSocket' in window) ||
    eventFeedSocket?.readyState === WebSocket.OPEN ||
    eventFeedSocket?.readyState === WebSocket.CONNECTING ||
    isEventFeedConnecting
  ) {
    return;
  }

  isEventFeedConnecting = true;
  const generation = eventFeedGeneration;
  void createTicketedSocket('/ws/events/feed/')
    .then(currentSocket => {
      if (listeners.size === 0 || generation !== eventFeedGeneration) {
        if (generation === eventFeedGeneration) {
          isEventFeedConnecting = false;
        }
        currentSocket.close();
        return;
      }

      eventFeedSocket = currentSocket;
      currentSocket.onopen = () => {
        if (eventFeedSocket !== currentSocket) {
          currentSocket.close();
          return;
        }

        isEventFeedConnecting = false;
        eventFeedReconnectAttempts = 0;
      };

      currentSocket.onmessage = message => {
        try {
          const payload: unknown = JSON.parse(message.data);
          if (
            typeof payload === 'object' &&
            payload !== null &&
            'type' in payload &&
            payload.type === 'feed.changed'
          ) {
            dispatchFeedChanged();
          }
        } catch {
          // Ignore malformed frames and keep the connection available.
        }
      };

      currentSocket.onclose = () => {
        if (eventFeedSocket !== currentSocket) return;
        isEventFeedConnecting = false;
        eventFeedSocket = null;
        scheduleEventFeedReconnect();
      };

      currentSocket.onerror = () => currentSocket.close();
    })
    .catch(() => {
      if (generation !== eventFeedGeneration) return;

      isEventFeedConnecting = false;
      scheduleEventFeedReconnect();
    });
};

export const subscribeToNotificationSocket = (listener: Listener) => {
  listeners.add(listener);
  if (!audioUnlockAttached && typeof document !== 'undefined') {
    document.addEventListener('pointerdown', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    audioUnlockAttached = true;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  connect();
  if (eventFeedReconnectTimer) {
    clearTimeout(eventFeedReconnectTimer);
    eventFeedReconnectTimer = null;
  }
  connectEventFeed();

  return () => {
    listeners.delete(listener);
    if (listeners.size !== 0) return;

    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    audioUnlockAttached = false;
    notificationGeneration += 1;
    eventFeedGeneration += 1;
    isConnecting = false;
    isEventFeedConnecting = false;

    if (feedChangeTimer) {
      clearTimeout(feedChangeTimer);
      feedChangeTimer = null;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (eventFeedReconnectTimer) {
      clearTimeout(eventFeedReconnectTimer);
      eventFeedReconnectTimer = null;
    }
    socket?.close();
    socket = null;
    eventFeedSocket?.close();
    eventFeedSocket = null;
  };
};
