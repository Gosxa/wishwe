import { create } from 'zustand';
import type { BackendEvent, BackendEventType } from '@/shared/client_api/event';

export type OnboardingStep =
  | 'welcome'
  | 'create'
  | 'type'
  | 'category'
  | 'title'
  | 'location'
  | 'description'
  | 'timeframe'
  | 'submit'
  | 'share'
  | 'done';

export type OnboardingField =
  | 'title'
  | 'location'
  | 'description'
  | 'timeframe';

export const ONBOARDING_ORDER: OnboardingStep[] = [
  'welcome',
  'create',
  'type',
  'category',
  'title',
  'location',
  'description',
  'timeframe',
  'submit',
  'share',
  'done',
];

export type OnboardingFormBridge = {
  isWish: boolean;
  categories: { id: number; name: string }[];
  selectedCategoryId: number | null;
  values: Record<OnboardingField, string>;
  canSubmit: boolean;
  chooseType: (type: BackendEventType) => void;
  chooseCategory: (id: number) => void;
  fill: (field: OnboardingField, value: string) => void;
};

type OnboardingStore = {
  step: OnboardingStep | null;
  form: OnboardingFormBridge | null;
  createdEvent: BackendEvent | null;
  begin: () => void;
  advance: () => void;
  syncForm: (form: OnboardingFormBridge | null) => void;
  reportCreated: (event: BackendEvent) => void;
  end: () => void;
  dismissShare: () => void;
};

const REQUIRED_FIELDS: OnboardingField[] = ['title', 'location', 'timeframe'];

const FORM_STEPS = new Set<OnboardingStep>([
  'type',
  'category',
  'title',
  'location',
  'description',
  'timeframe',
  'submit',
]);

const reconcile = (
  step: OnboardingStep,
  form: OnboardingFormBridge | null,
  hasCreatedEvent: boolean,
): OnboardingStep => {
  if (hasCreatedEvent) return step;
  if (step === 'create') return form ? 'type' : 'create';
  if (!FORM_STEPS.has(step)) return step;
  if (!form) return 'create';
  if (!form.isWish) return 'type';
  if (step === 'type') return 'category';
  if (!form.selectedCategoryId) return 'category';
  if (step === 'category') return 'title';

  if (step === 'submit') {
    const missing = REQUIRED_FIELDS.find(field => !form.values[field].trim());

    if (missing) return missing;
  }

  return step;
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  step: null,
  form: null,
  createdEvent: null,

  begin: () => set({ step: 'welcome', form: null, createdEvent: null }),

  advance: () => {
    const { step } = get();

    if (!step) return;

    const next = ONBOARDING_ORDER[ONBOARDING_ORDER.indexOf(step) + 1];

    if (next) set({ step: next });
  },

  syncForm: form =>
    set(state => {
      if (!state.step) return state;

      const step = reconcile(state.step, form, state.createdEvent !== null);

      if (step === state.step && form === state.form) return state;

      return { step, form };
    }),

  reportCreated: createdEvent =>
    set(state => (state.step ? { createdEvent, step: 'share' } : state)),

  end: () => set({ step: null, form: null }),

  dismissShare: () => set({ createdEvent: null }),
}));
