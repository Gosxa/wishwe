import { create } from 'zustand';

import { Profile } from '@/shared/client_api/auth/types';

type UserStore = {
  user: Profile | null;
  setUser: (user: Profile) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>(set => ({
  user: null,
  setUser: user => set({ user }),
  clearUser: () => set({ user: null }),
}));
