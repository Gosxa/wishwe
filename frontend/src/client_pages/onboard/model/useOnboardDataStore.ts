import { create } from 'zustand';

type FieldKey = 'email' | 'password' | 'nickname' | 'firstName' | 'lastName';

type OnboardDataStore = {
  email: string;
  password: string;
  nickname: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  verificationToken: string | null;
  setField: (field: FieldKey, value: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setVerificationToken: (token: string) => void;
  reset: () => void;
};

const initialState = {
  email: '',
  password: '',
  nickname: '',
  firstName: '',
  lastName: '',
  avatarUrl: null,
  verificationToken: null,
};

export const useOnboardDataStore = create<OnboardDataStore>(set => ({
  ...initialState,
  setField: (field, value) => set({ [field]: value }),
  setAvatarUrl: url => set({ avatarUrl: url }),
  setVerificationToken: token => set({ verificationToken: token }),
  reset: () => set(initialState),
}));
