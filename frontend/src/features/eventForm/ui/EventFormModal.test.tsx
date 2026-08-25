// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { ComponentPropsWithRef } from 'react';
import type { BackendEventType } from '@/shared/client_api/event';

const eventApiMocks = vi.hoisted(() => ({
  listCategories: vi.fn(),
}));

const imageMocks = vi.hoisted(() => ({
  prepareCoverImage: vi.fn(),
}));

vi.mock('@/shared/client_api/event', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/client_api/event')>();

  return { ...actual, listCategories: eventApiMocks.listCategories };
});

vi.mock('@/shared/lib/validation/imageUpload', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@/shared/lib/validation/imageUpload')
    >();

  return { ...actual, prepareCoverImage: imageMocks.prepareCoverImage };
});

import { MAX_COVER_IMAGE_SIZE } from '@/shared/lib/validation/imageUpload';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useEventForm } from '../model/useEventForm';
import type { EventFormMode, EventFormValues } from '../model/types';
import { EventFormModal } from './EventFormModal';

const NOW = new Date(2026, 7, 19, 10, 0, 0);
const TODAY = '2026-08-19';
const PAST_DATE = '2026-08-18';
const FUTURE_DATE = '2026-08-25';

const categories = [
  { id: 7, name: 'Outdoors' },
  { id: 9, name: 'Culture' },
];

type SubmitEventFn = (
  type: BackendEventType,
  payload: FormData | Record<string, unknown>,
) => Promise<unknown>;

const OVERLAY_PROPS = {
  'data-modal-state': 'open',
} as ComponentPropsWithRef<'div'>;

class SubmitError extends Error {
  constructor(public readonly body: Record<string, unknown>) {
    super('Failed');
  }
}

const CREATE_VALUES: EventFormValues = {
  type: 'plan',
  categoryId: null,
  title: '',
  location: '',
  description: '',
  eventDate: '',
  eventTime: '',
  minParticipants: 1,
  maxParticipants: 2,
  unlimited: true,
  timeframeText: '',
  chatLink: '',
  visibility: 'f-o-f',
};

const EDIT_VALUES: EventFormValues = {
  type: 'plan',
  categoryId: null,
  title: 'Mountain walk',
  location: 'Carpathians',
  description: 'Bring water',
  eventDate: FUTURE_DATE,
  eventTime: '14:30',
  minParticipants: 2,
  maxParticipants: 8,
  unlimited: false,
  timeframeText: '',
  chatLink: '',
  visibility: 'f-o-f',
};

type HarnessProps = {
  mode: EventFormMode;
  initialValues: EventFormValues;
  initialCategoryName?: string | null;
  initialCoverUrl?: string | null;
  resetType?: BackendEventType;
  submitEvent: SubmitEventFn;
  onSuccess: () => void;
  onClose: () => void;
};

const Harness = ({
  mode,
  initialValues,
  initialCategoryName,
  initialCoverUrl,
  resetType,
  submitEvent,
  onSuccess,
  onClose,
}: HarnessProps) => {
  const form = useEventForm({
    mode,
    initialValues,
    initialCategoryName,
    initialCoverUrl,
    resetType,
    submitEvent,
    submitErrorBody: error =>
      error instanceof SubmitError ? error.body : ({} as never),
    onSuccess,
  });

  return (
    <EventFormModal
      mode={mode}
      form={form}
      onClose={onClose}
      overlayProps={OVERLAY_PROPS}
    />
  );
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const imageFile = (name = 'cover.png', type = 'image/png') =>
  new File(['cover'], name, { type });

const oversizeImageFile = () => {
  const file = imageFile('huge.png');

  Object.defineProperty(file, 'size', { value: MAX_COVER_IMAGE_SIZE + 1 });

  return file;
};

const submitButton = (mode: EventFormMode = 'create') =>
  screen.getByRole('button', {
    name: mode === 'create' ? 'Share' : 'Save changes',
  }) as HTMLButtonElement;

const fileInput = () =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

const typeInto = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const awaitCategories = () => screen.findByRole('button', { name: 'outdoors' });

describe('EventFormModal', () => {
  let submitEvent: Mock<SubmitEventFn>;
  let onSuccess: Mock<() => void>;
  let onClose: Mock<() => void>;
  let objectUrlIndex: number;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    eventApiMocks.listCategories.mockReset();
    eventApiMocks.listCategories.mockResolvedValue(categories);
    imageMocks.prepareCoverImage.mockReset();
    imageMocks.prepareCoverImage.mockImplementation(async (file: File) => file);

    submitEvent = vi.fn<SubmitEventFn>().mockResolvedValue({ id: 1 });
    onSuccess = vi.fn<() => void>();
    onClose = vi.fn<() => void>();

    objectUrlIndex = 0;
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:cover-${++objectUrlIndex}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: vi.fn(() => ({ cancel: vi.fn() })),
    });
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );

    useLoadingStore.setState({ isLoading: false });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const renderForm = (
    mode: EventFormMode = 'create',
    overrides: Partial<HarnessProps> = {},
  ) =>
    render(
      <Harness
        mode={mode}
        initialValues={mode === 'create' ? CREATE_VALUES : EDIT_VALUES}
        initialCategoryName={mode === 'edit' ? 'Outdoors' : undefined}
        initialCoverUrl={mode === 'edit' ? 'https://cdn.test/cover.jpg' : null}
        resetType={mode === 'create' ? 'plan' : undefined}
        submitEvent={submitEvent}
        onSuccess={onSuccess}
        onClose={onClose}
        {...overrides}
      />,
    );

  const fillRequiredPlanFields = async () => {
    await awaitCategories();

    fireEvent.click(screen.getByRole('button', { name: 'outdoors' }));
    typeInto("What's the plan?", 'Mountain walk');
    typeInto('Where?', 'Carpathians');
    typeInto('Event date', FUTURE_DATE);
    typeInto('Event time', '14:30');
  };

  describe('mode and type rendering', () => {
    it('renders the create plan form with plan copy and controls', async () => {
      renderForm();

      expect(
        screen.getByRole('heading', { name: 'Create a plan' }),
      ).toBeTruthy();
      expect(
        screen.getByLabelText("What's the plan?").getAttribute('placeholder'),
      ).toBe('e.g., Friday pizza party');
      expect(screen.getByLabelText('Where?').getAttribute('placeholder')).toBe(
        'Name of the spot or address',
      );
      expect(
        screen.getByLabelText('Description').getAttribute('placeholder'),
      ).toBe('Share some details: the vibe, what to bring, etc.');

      expect(screen.getByLabelText('Event date')).toBeTruthy();
      expect(screen.getByLabelText('Event time')).toBeTruthy();
      expect(screen.getByLabelText('Chat link')).toBeTruthy();
      expect(screen.queryByLabelText('Timeframe')).toBeNull();
      expect(
        screen.getByText('Scheduled event with a fixed date.'),
      ).toBeTruthy();

      expect(
        screen
          .getByRole('button', { name: 'Plan' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
      expect(
        screen
          .getByRole('button', { name: 'Wish' })
          .getAttribute('aria-pressed'),
      ).toBe('false');

      await awaitCategories();
    });

    it('renders the create wish form when the wish type is chosen', async () => {
      renderForm();

      fireEvent.click(screen.getByRole('button', { name: 'Wish' }));

      expect(
        screen.getByRole('heading', { name: 'Create a wish' }),
      ).toBeTruthy();
      expect(
        screen.getByLabelText("What's your wish?").getAttribute('placeholder'),
      ).toBe('e.g., Picnic in the park');
      expect(
        screen.getByLabelText('Timeframe').getAttribute('placeholder'),
      ).toBe('Next weekend or sometime in June');
      expect(screen.queryByLabelText('Event date')).toBeNull();
      expect(screen.queryByLabelText('Event time')).toBeNull();
      expect(screen.queryByLabelText('Chat link')).toBeNull();
      expect(
        screen.getByText('An idea for the future without a specific time.'),
      ).toBeTruthy();
      expect(
        screen
          .getByRole('button', { name: 'Wish' })
          .getAttribute('aria-pressed'),
      ).toBe('true');

      await awaitCategories();
    });

    it('clears stale validation errors when the type is switched', async () => {
      renderForm();
      await fillRequiredPlanFields();

      typeInto('Chat link', 'not-a-link');
      fireEvent.click(submitButton());

      expect(screen.getByText('Enter a valid link (https://…)')).toBeTruthy();
      expect(submitEvent).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Wish' }));
      fireEvent.click(screen.getByRole('button', { name: 'Plan' }));

      expect(screen.queryByText('Enter a valid link (https://…)')).toBeNull();
    });

    it('renders the edit form with existing values and a locked type', async () => {
      renderForm('edit');

      expect(screen.getByRole('heading', { name: 'Edit a plan' })).toBeTruthy();
      expect(
        (screen.getByLabelText("What's the plan?") as HTMLInputElement).value,
      ).toBe('Mountain walk');
      expect((screen.getByLabelText('Where?') as HTMLInputElement).value).toBe(
        'Carpathians',
      );
      expect(
        (screen.getByLabelText('Event date') as HTMLInputElement).value,
      ).toBe(FUTURE_DATE);

      expect(screen.queryByRole('button', { name: 'Plan' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Wish' })).toBeNull();
      expect(screen.queryByRole('radio', { name: 'Friends only' })).toBeNull();
      expect(
        screen.getByRole('img', { name: 'Event cover' }).getAttribute('src'),
      ).toBe('https://cdn.test/cover.jpg');

      await awaitCategories();
    });
  });

  describe('categories', () => {
    it('loads the categories and toggles a selection', async () => {
      renderForm();
      await awaitCategories();

      expect(eventApiMocks.listCategories).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'culture' })).toBeTruthy();

      typeInto("What's the plan?", 'Mountain walk');
      typeInto('Where?', 'Carpathians');
      typeInto('Event date', FUTURE_DATE);
      typeInto('Event time', '14:30');

      expect(submitButton().disabled).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'outdoors' }));
      expect(submitButton().disabled).toBe(false);

      fireEvent.click(screen.getByRole('button', { name: 'outdoors' }));
      expect(submitButton().disabled).toBe(true);
    });

    it('preselects the category of an edited event', async () => {
      renderForm('edit');
      await awaitCategories();

      await act(async () => {
        await Promise.resolve();
      });

      fireEvent.click(submitButton('edit'));

      await waitFor(() => expect(submitEvent).toHaveBeenCalled());
      expect(submitEvent.mock.calls[0][1]).toMatchObject({ category: 7 });
    });

    it('surfaces a category loading failure', async () => {
      eventApiMocks.listCategories.mockRejectedValue(new Error('offline'));
      renderForm();

      expect(
        await screen.findByText('Failed to load categories. Please try again.'),
      ).toBeTruthy();
    });
  });

  describe('required-field gating', () => {
    it('keeps create submission disabled until every required field is set', async () => {
      renderForm();
      await awaitCategories();

      expect(submitButton().disabled).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'outdoors' }));
      expect(submitButton().disabled).toBe(true);

      typeInto("What's the plan?", 'Mountain walk');
      expect(submitButton().disabled).toBe(true);

      typeInto('Where?', 'Carpathians');
      expect(submitButton().disabled).toBe(true);

      typeInto('Event date', FUTURE_DATE);
      expect(submitButton().disabled).toBe(true);

      typeInto('Event time', '14:30');
      expect(submitButton().disabled).toBe(false);
    });

    it('requires a timeframe instead of a date for a wish', async () => {
      renderForm();
      await awaitCategories();

      fireEvent.click(screen.getByRole('button', { name: 'Wish' }));
      fireEvent.click(screen.getByRole('button', { name: 'outdoors' }));
      typeInto("What's your wish?", 'Board games night');
      typeInto('Where?', 'My place');

      expect(submitButton().disabled).toBe(true);

      typeInto('Timeframe', 'Next weekend');
      expect(submitButton().disabled).toBe(false);
    });

    it('keeps edit submission enabled but still validates on submit', async () => {
      renderForm('edit');
      await awaitCategories();

      typeInto("What's the plan?", '   ');
      expect(submitButton('edit').disabled).toBe(false);

      fireEvent.click(submitButton('edit'));

      expect(screen.getByText('Title is required')).toBeTruthy();
      expect(submitEvent).not.toHaveBeenCalled();
    });
  });

  describe('date and time rules', () => {
    it('never allows a date before today', async () => {
      renderForm();
      await awaitCategories();

      expect(screen.getByLabelText('Event date').getAttribute('min')).toBe(
        TODAY,
      );

      typeInto('Event date', PAST_DATE);
      expect(screen.getByText('Date cannot be in the past')).toBeTruthy();

      typeInto('Event date', FUTURE_DATE);
      expect(screen.queryByText('Date cannot be in the past')).toBeNull();
    });

    it('constrains the time to the current time when the date is today', async () => {
      renderForm();
      await awaitCategories();

      typeInto('Event date', TODAY);
      expect(screen.getByLabelText('Event time').getAttribute('min')).toBe(
        '10:00',
      );

      typeInto('Event time', '09:30');
      expect(screen.getByText('Time cannot be in the past')).toBeTruthy();

      typeInto('Event time', '11:30');
      expect(screen.queryByText('Time cannot be in the past')).toBeNull();
    });

    it('drops the time minimum for a future date', async () => {
      renderForm();
      await awaitCategories();

      typeInto('Event date', FUTURE_DATE);

      expect(screen.getByLabelText('Event time').hasAttribute('min')).toBe(
        false,
      );

      typeInto('Event time', '00:30');
      expect(screen.queryByText('Time cannot be in the past')).toBeNull();
    });

    it('blocks submission of a past date time combination', async () => {
      renderForm();
      await fillRequiredPlanFields();

      typeInto('Event date', TODAY);
      typeInto('Event time', '08:00');

      expect(submitButton().disabled).toBe(true);
      expect(submitEvent).not.toHaveBeenCalled();
    });
  });

  describe('participants', () => {
    it('hides the max stepper while unlimited is on and sends the unlimited size', async () => {
      renderForm();
      await fillRequiredPlanFields();

      const unlimited = screen.getByRole('switch') as HTMLInputElement;

      expect(unlimited.checked).toBe(true);
      expect(screen.queryByRole('textbox', { name: 'Max' })).toBeNull();

      fireEvent.click(submitButton());
      await waitFor(() => expect(submitEvent).toHaveBeenCalled());

      expect(submitEvent.mock.calls[0][1]).toMatchObject({
        min_participants: 1,
        max_participants: 3000,
      });
    });

    it('reveals the max stepper when unlimited is turned off', async () => {
      renderForm();
      await fillRequiredPlanFields();

      fireEvent.click(screen.getByRole('switch'));

      const max = screen.getByRole('textbox', {
        name: 'Max',
      }) as HTMLInputElement;

      expect(max.value).toBe('2');

      fireEvent.click(screen.getByRole('button', { name: 'Increase Max' }));
      fireEvent.click(screen.getByRole('button', { name: 'Increase Min' }));

      expect(
        (screen.getByRole('textbox', { name: 'Max' }) as HTMLInputElement)
          .value,
      ).toBe('3');
      expect(
        (screen.getByRole('textbox', { name: 'Min' }) as HTMLInputElement)
          .value,
      ).toBe('2');

      fireEvent.click(submitButton());
      await waitFor(() => expect(submitEvent).toHaveBeenCalled());

      expect(submitEvent.mock.calls[0][1]).toMatchObject({
        min_participants: 2,
        max_participants: 3,
      });
    });

    it('rejects a maximum below the minimum', async () => {
      renderForm();
      await fillRequiredPlanFields();

      fireEvent.click(screen.getByRole('switch'));
      fireEvent.change(screen.getByRole('textbox', { name: 'Min' }), {
        target: { value: '9' },
      });
      fireEvent.blur(screen.getByRole('textbox', { name: 'Min' }));

      fireEvent.click(submitButton());

      expect(screen.getByText('Max cannot be less than min')).toBeTruthy();
      expect(submitEvent).not.toHaveBeenCalled();

      fireEvent.change(screen.getByRole('textbox', { name: 'Max' }), {
        target: { value: '12' },
      });
      fireEvent.blur(screen.getByRole('textbox', { name: 'Max' }));

      expect(screen.queryByText('Max cannot be less than min')).toBeNull();
    });

    it('asks a wish only for a minimum number of friends', async () => {
      renderForm();
      await awaitCategories();

      fireEvent.click(screen.getByRole('button', { name: 'Wish' }));
      fireEvent.click(screen.getByRole('button', { name: 'outdoors' }));
      typeInto("What's your wish?", 'Board games night');
      typeInto('Where?', 'My place');
      typeInto('Timeframe', 'Next weekend');

      expect(screen.queryByRole('textbox', { name: 'Max' })).toBeNull();
      expect(screen.queryByRole('switch')).toBeNull();
      expect(screen.getByText('How many friends do you need?')).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Increase Min' }));
      fireEvent.click(submitButton());

      await waitFor(() => expect(submitEvent).toHaveBeenCalled());
      expect(submitEvent.mock.calls[0][0]).toBe('wish');
      expect(submitEvent.mock.calls[0][1]).toMatchObject({
        timeframe_text: 'Next weekend',
        min_participants: 2,
      });
      expect(submitEvent.mock.calls[0][1]).not.toHaveProperty(
        'max_participants',
      );
    });
  });

  describe('text fields and privacy', () => {
    it('trims the text fields it sends and keeps the chosen privacy', async () => {
      renderForm();
      await awaitCategories();

      fireEvent.click(screen.getByRole('button', { name: 'outdoors' }));
      typeInto("What's the plan?", '  Mountain walk  ');
      typeInto('Where?', '  Carpathians  ');
      typeInto('Description', '  Bring water  ');
      typeInto('Event date', FUTURE_DATE);
      typeInto('Event time', '14:30');
      typeInto('Chat link', '  https://t.me/walk  ');

      fireEvent.click(screen.getByRole('radio', { name: 'Friends only' }));
      expect(
        screen.getByText(
          'Only your direct friends can see and join this event',
        ),
      ).toBeTruthy();

      fireEvent.click(submitButton());
      await waitFor(() => expect(submitEvent).toHaveBeenCalled());

      expect(submitEvent).toHaveBeenCalledWith('plan', {
        title: 'Mountain walk',
        location: 'Carpathians',
        description: 'Bring water',
        min_participants: 1,
        max_participants: 3000,
        event_visibility: 'friends-only',
        category: 7,
        event_date: FUTURE_DATE,
        event_time: '14:30',
        external_link: 'https://t.me/walk',
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('defaults to friends of friends privacy', async () => {
      renderForm();
      await awaitCategories();

      expect(
        (
          screen.getByRole('radio', {
            name: 'Friends of friends',
          }) as HTMLInputElement
        ).checked,
      ).toBe(true);
      expect(
        screen.getByText(
          'Friends and friends-of-friends can see and join this event',
        ),
      ).toBeTruthy();
    });

    it('rejects a chat link that is not an http(s) URL', async () => {
      renderForm();
      await fillRequiredPlanFields();

      typeInto('Chat link', 'javascript:alert(1)');
      fireEvent.click(submitButton());

      expect(screen.getByText('Enter a valid link (https://…)')).toBeTruthy();
      expect(submitEvent).not.toHaveBeenCalled();

      typeInto('Chat link', 'https://t.me/walk');
      expect(screen.queryByText('Enter a valid link (https://…)')).toBeNull();

      fireEvent.click(submitButton());
      await waitFor(() => expect(submitEvent).toHaveBeenCalled());
    });

    it('rejects a title over the 50 character limit', async () => {
      renderForm();
      await fillRequiredPlanFields();

      fireEvent.change(screen.getByLabelText("What's the plan?"), {
        target: { value: 'a'.repeat(51) },
      });
      fireEvent.click(submitButton());

      expect(screen.getByText('Up to 50 characters')).toBeTruthy();
      expect(submitEvent).not.toHaveBeenCalled();
    });
  });

  describe('cover image', () => {
    it('accepts a picked image and sends it as multipart form data', async () => {
      renderForm();
      await fillRequiredPlanFields();

      const file = imageFile();

      await act(async () => {
        fireEvent.change(fileInput(), { target: { files: [file] } });
      });

      expect(
        screen.getByRole('img', { name: 'Event cover' }).getAttribute('src'),
      ).toBe('blob:cover-1');

      fireEvent.click(submitButton());
      await waitFor(() => expect(submitEvent).toHaveBeenCalled());

      const payload = submitEvent.mock.calls[0][1] as FormData;

      expect(payload).toBeInstanceOf(FormData);
      expect(payload.get('cover_image')).toBe(file);
      expect(payload.get('title')).toBe('Mountain walk');
    });

    it('accepts a dropped image', async () => {
      renderForm();
      await awaitCategories();

      const dropArea = fileInput().parentElement as HTMLElement;

      await act(async () => {
        fireEvent.drop(dropArea, {
          dataTransfer: { files: [imageFile('shot.jpg', 'image/jpeg')] },
        });
      });

      expect(
        screen.getByRole('img', { name: 'Event cover' }).getAttribute('src'),
      ).toBe('blob:cover-1');
    });

    it('rejects an unsupported file type', async () => {
      renderForm();
      await awaitCategories();

      await act(async () => {
        fireEvent.change(fileInput(), {
          target: { files: [imageFile('notes.txt', 'text/plain')] },
        });
      });

      expect(screen.getByText('Unsupported image format')).toBeTruthy();
      expect(screen.queryByRole('img', { name: 'Event cover' })).toBeNull();
      expect(imageMocks.prepareCoverImage).not.toHaveBeenCalled();
    });

    it('rejects a file over 5 MB before any conversion', async () => {
      renderForm();
      await awaitCategories();

      await act(async () => {
        fireEvent.change(fileInput(), {
          target: { files: [oversizeImageFile()] },
        });
      });

      expect(screen.getByText('Image must be 5 MB or less')).toBeTruthy();
      expect(imageMocks.prepareCoverImage).not.toHaveBeenCalled();
    });

    it('rejects an image that is still too large after conversion', async () => {
      imageMocks.prepareCoverImage.mockResolvedValue(oversizeImageFile());
      renderForm();
      await awaitCategories();

      await act(async () => {
        fireEvent.change(fileInput(), {
          target: { files: [imageFile('photo.heic', 'image/heic')] },
        });
      });

      expect(
        screen.getByText('Converted image must be 5 MB or less'),
      ).toBeTruthy();
      expect(screen.queryByRole('img', { name: 'Event cover' })).toBeNull();
    });

    it('reports a conversion failure', async () => {
      imageMocks.prepareCoverImage.mockRejectedValue(new Error('bad heic'));
      renderForm();
      await awaitCategories();

      await act(async () => {
        fireEvent.change(fileInput(), {
          target: { files: [imageFile('photo.heic', 'image/heic')] },
        });
      });

      expect(screen.getByText('Could not process this image')).toBeTruthy();
    });

    it('shows the processing state and blocks submission until it finishes', async () => {
      const conversion = deferred<File>();

      imageMocks.prepareCoverImage.mockReturnValue(conversion.promise);

      renderForm();
      await fillRequiredPlanFields();

      expect(submitButton().disabled).toBe(false);

      fireEvent.change(fileInput(), {
        target: { files: [imageFile('photo.heic', 'image/heic')] },
      });

      expect(
        screen.getByRole('button', { name: 'Processing...' }),
      ).toBeTruthy();
      expect(submitButton().disabled).toBe(true);

      await act(async () => {
        conversion.resolve(imageFile('photo.jpg', 'image/jpeg'));
      });

      expect(submitButton().disabled).toBe(false);
      expect(screen.getByRole('button', { name: 'Change photo' })).toBeTruthy();
      expect(submitEvent).not.toHaveBeenCalled();
    });

    it('replaces the preview and revokes the previous object URL', async () => {
      renderForm();
      await awaitCategories();

      await act(async () => {
        fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
      });

      expect(
        screen.getByRole('img', { name: 'Event cover' }).getAttribute('src'),
      ).toBe('blob:cover-1');

      await act(async () => {
        fireEvent.change(fileInput(), {
          target: { files: [imageFile('second.png')] },
        });
      });

      expect(
        screen.getByRole('img', { name: 'Event cover' }).getAttribute('src'),
      ).toBe('blob:cover-2');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:cover-1');
    });

    it('clears the cover error once a valid image is chosen', async () => {
      renderForm();
      await awaitCategories();

      await act(async () => {
        fireEvent.change(fileInput(), {
          target: { files: [imageFile('notes.txt', 'text/plain')] },
        });
      });

      expect(screen.getByText('Unsupported image format')).toBeTruthy();

      await act(async () => {
        fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
      });

      expect(screen.queryByText('Unsupported image format')).toBeNull();
    });
  });

  describe('submission', () => {
    it('blocks a duplicate submission while the first one is in flight', async () => {
      const request = deferred<unknown>();

      submitEvent.mockReturnValue(request.promise);

      renderForm();
      await fillRequiredPlanFields();

      fireEvent.click(submitButton());

      expect(submitButton().disabled).toBe(true);
      expect(useLoadingStore.getState().isLoading).toBe(true);

      fireEvent.click(submitButton());
      expect(submitEvent).toHaveBeenCalledTimes(1);

      await act(async () => {
        request.resolve({ id: 1 });
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(useLoadingStore.getState().isLoading).toBe(false);
    });

    it('maps API field errors onto the matching controls', async () => {
      submitEvent.mockRejectedValue(
        new SubmitError({
          title: ['This title is already taken'],
          event_date: ['Pick another day'],
          cover_image: ['Cover is too wide'],
          non_field_errors: ['You reached your event limit'],
        }),
      );

      renderForm();
      await fillRequiredPlanFields();

      fireEvent.click(submitButton());

      expect(
        await screen.findByText('This title is already taken'),
      ).toBeTruthy();
      expect(screen.getByText('Pick another day')).toBeTruthy();
      expect(screen.getByText('Cover is too wide')).toBeTruthy();
      expect(screen.getByText('You reached your event limit')).toBeTruthy();

      expect(submitButton().disabled).toBe(false);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(useLoadingStore.getState().isLoading).toBe(false);
    });

    it('falls back to a generic message when the API gives no details', async () => {
      submitEvent.mockRejectedValue(new SubmitError({}));

      renderForm();
      await fillRequiredPlanFields();

      fireEvent.click(submitButton());

      expect(
        await screen.findByText('Something went wrong. Please try again.'),
      ).toBeTruthy();
    });

    it('clears the general submit error as soon as a field is edited', async () => {
      submitEvent.mockRejectedValue(new SubmitError({}));

      renderForm();
      await fillRequiredPlanFields();
      fireEvent.click(submitButton());

      expect(
        await screen.findByText('Something went wrong. Please try again.'),
      ).toBeTruthy();

      typeInto("What's the plan?", 'Mountain walk!');

      expect(
        screen.queryByText('Something went wrong. Please try again.'),
      ).toBeNull();
    });

    it('sends an edit through the edit payload rules', async () => {
      renderForm('edit');
      await awaitCategories();

      typeInto('Description', '');
      typeInto('Chat link', '');

      fireEvent.click(submitButton('edit'));
      await waitFor(() => expect(submitEvent).toHaveBeenCalled());

      const payload = submitEvent.mock.calls[0][1] as Record<string, unknown>;

      expect(payload.description).toBe('');
      expect(payload.external_link).toBe('');
      expect(payload).not.toHaveProperty('event_visibility');
      expect(payload).toMatchObject({
        title: 'Mountain walk',
        event_date: FUTURE_DATE,
        event_time: '14:30',
        min_participants: 2,
        max_participants: 8,
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('modal chrome', () => {
    it('exposes the dialog semantics of the current mode', async () => {
      renderForm();

      const dialog = screen.getByRole('dialog');

      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('createEventTitle');
      expect(
        screen
          .getByRole('heading', { name: 'Create a plan' })
          .getAttribute('id'),
      ).toBe('createEventTitle');

      await awaitCategories();
    });

    it('closes only through the explicit close control', async () => {
      const { container } = renderForm();
      const overlay = container.firstElementChild as HTMLElement;
      const dialog = screen.getByRole('dialog');

      fireEvent.click(overlay);
      expect(onClose).not.toHaveBeenCalled();
      expect(dialog.animate).toHaveBeenCalled();

      fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalledTimes(1);

      await awaitCategories();
    });

    it('locks body scrolling while it is open and restores it on close', async () => {
      document.body.style.position = 'relative';

      const { unmount } = renderForm();

      await awaitCategories();
      expect(document.body.style.position).toBe('fixed');

      unmount();
      expect(document.body.style.position).toBe('relative');
    });
  });
});
