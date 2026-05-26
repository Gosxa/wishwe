import { create } from 'zustand';
import type { Fields } from '../widgets/profileForm/model/types';

type OnboardDataStore = {
  values: Fields;
  avatarUrl: string | null;
  setField: (field: keyof Fields, value: string) => void;
  setAvatarUrl: (url: string | null) => void;
  reset: () => void;
};

const initialValues: Fields = {
  email: '',
  nickname: '',
  firstName: '',
  lastName: '',
};

export const useOnboardDataStore = create<OnboardDataStore>(set => ({
  values: initialValues,
  avatarUrl: null,
  setField: (field, value) =>
    set(s => ({ values: { ...s.values, [field]: value } })),
  setAvatarUrl: url => set({ avatarUrl: url }),
  reset: () => set({ values: initialValues, avatarUrl: null }),
}));
