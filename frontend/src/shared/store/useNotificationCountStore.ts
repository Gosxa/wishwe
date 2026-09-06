import { create } from 'zustand';

// Share the header's unread count with the mobile navigation without a second poll.
export const useNotificationCountStore = create<{
  unreadCount: number;
  setUnreadCount: (unreadCount: number) => void;
}>(set => ({
  unreadCount: 0,
  setUnreadCount: unreadCount => set({ unreadCount }),
}));
