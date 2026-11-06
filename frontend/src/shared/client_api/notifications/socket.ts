import type { NotificationItem } from './types';

type SocketEvent =
  | { type: 'connected' }
  | { type: 'notification'; notification: NotificationItem };
type Listener = (event: SocketEvent) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
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

const connect = () => {
  if (
    typeof window === 'undefined' ||
    !('WebSocket' in window) ||
    socket?.readyState === WebSocket.OPEN ||
    socket?.readyState === WebSocket.CONNECTING
  ) {
    return;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL;
  const socketBase = configuredUrl
    ? configuredUrl.replace(/\/$/, '')
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
        window.location.host
      }`;
  const currentSocket = new WebSocket(`${socketBase}/ws/notifications/`);
  socket = currentSocket;

  currentSocket.onopen = () => {
    reconnectAttempts = 0;
    listeners.forEach(listener => listener({ type: 'connected' }));
  };

  currentSocket.onmessage = message => {
    try {
      const notification = JSON.parse(message.data) as NotificationItem;
      playNotificationSound();
      window.dispatchEvent(
        new CustomEvent('wishwe:notification', { detail: notification }),
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
    socket = null;
    if (listeners.size === 0 || reconnectTimer) return;

    const delay = Math.min(1000 * 2 ** reconnectAttempts, 30_000);
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  currentSocket.onerror = () => currentSocket.close();
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

  return () => {
    listeners.delete(listener);
    if (listeners.size !== 0) return;

    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    audioUnlockAttached = false;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    socket?.close();
    socket = null;
  };
};
