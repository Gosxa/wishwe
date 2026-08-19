import type { BackendEventType, Category } from '@/shared/client_api/event';

export type EventVisibility = 'friends-only' | 'f-o-f';

export type EventFormErrors = {
  category?: string;
  title?: string;
  location?: string;
  description?: string;
  eventDate?: string;
  eventTime?: string;
  minParticipants?: string;
  maxParticipants?: string;
  timeframeText?: string;
  chatLink?: string;
  cover?: string;
  submit?: string;
};

export type EventFormValues = {
  type: BackendEventType;
  categoryId: number | null;
  title: string;
  location: string;
  description: string;
  eventDate: string;
  eventTime: string;
  minParticipants: number;
  maxParticipants: number;
  unlimited: boolean;
  timeframeText: string;
  chatLink: string;
  visibility: EventVisibility;
};

export type EventFormMode = 'create' | 'edit';

export type EventFormModel = {
  isPlan: boolean;
  onTypeChange: (type: BackendEventType) => void;
  category: {
    options: Category[];
    selected: number | null;
    onChange: (id: number | null) => void;
    error?: string;
  };
  titleInput: TextFieldModel;
  locationInput: TextFieldModel;
  descriptionInput: TextFieldModel;
  dateInput: TextFieldModel & { min: string };
  timeInput: TextFieldModel & { min?: string };
  participants: {
    min: number;
    max: number;
    unlimited: boolean;
    onMinChange: (value: number) => void;
    onMaxChange: (value: number) => void;
    onUnlimitedChange: (value: boolean) => void;
    minError?: string;
    maxError?: string;
  };
  timeframeInput: TextFieldModel;
  chatLinkInput: TextFieldModel;
  visibility: {
    value: EventVisibility;
    onChange: (value: EventVisibility) => void;
  };
  cover: {
    previewUrl: string | null;
    onSelect: (file: File) => Promise<void>;
    error?: string;
    isProcessing: boolean;
  };
  hasRequiredFields: boolean;
  submit: {
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
    error?: string;
  };
};

type TextFieldModel = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};
