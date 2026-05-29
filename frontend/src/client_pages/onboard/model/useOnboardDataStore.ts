import { create } from 'zustand';

type AuthMethod = 'email' | 'google' | null;

type FieldKey = 'email' | 'password' | 'nickname' | 'firstName' | 'lastName';

type OnboardDataStore = {
  email: string;
  password: string;
  nickname: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  verificationToken: string | null;
  isLoading: boolean;
  isPasswordReset: boolean;
  authMethod: AuthMethod;
  setField: (field: FieldKey, value: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setVerificationToken: (token: string) => void;
  setLoading: (value: boolean) => void;
  setIsPasswordReset: (value: boolean) => void;
  setAuthMethod: (method: AuthMethod) => void;
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
  isLoading: false,
  isPasswordReset: false,
  authMethod: null,
};

export const useOnboardDataStore = create<OnboardDataStore>(set => ({
  ...initialState,
  setField: (field, value) => set({ [field]: value }),
  setAvatarUrl: url => set({ avatarUrl: url }),
  setVerificationToken: token => set({ verificationToken: token }),
  setLoading: value => set({ isLoading: value }),
  setIsPasswordReset: value => set({ isPasswordReset: value }),
  setAuthMethod: method => set({ authMethod: method }),
  reset: () => set(initialState),
}));
