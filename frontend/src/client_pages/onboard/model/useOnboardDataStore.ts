import { create } from 'zustand';

type AuthMethod = 'email' | 'google' | null;
export type AuthFlow = 'login' | 'register' | 'reset';

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
  authMethod: AuthMethod;
  authFlow: AuthFlow;
  setField: (field: FieldKey, value: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setVerificationToken: (token: string) => void;
  setLoading: (value: boolean) => void;
  setAuthMethod: (method: AuthMethod) => void;
  setAuthFlow: (flow: AuthFlow) => void;
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
  authMethod: null,
  authFlow: 'login' as AuthFlow,
};

export const useOnboardDataStore = create<OnboardDataStore>(set => ({
  ...initialState,
  setField: (field, value) => set({ [field]: value }),
  setAvatarUrl: url => set({ avatarUrl: url }),
  setVerificationToken: token => set({ verificationToken: token }),
  setLoading: value => set({ isLoading: value }),
  setAuthMethod: method => set({ authMethod: method }),
  setAuthFlow: flow => set({ authFlow: flow }),
  reset: () => set(initialState),
}));
