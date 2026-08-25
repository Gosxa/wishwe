// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { BackendEvent } from '@/shared/client_api/event';
import type { EventFormModel } from '@/features/eventForm';
import { useCreatedEventShareStore } from '@/shared/store/useCreatedEventShareStore';
import { useOnboardingStore } from '@/shared/store/useOnboardingStore';
import { useEventsRefreshStore } from '@/shared/store/useEventsRefreshStore';

const mocks = vi.hoisted(() => ({
  requestClose: vi.fn(),
  useCreateEvent: vi.fn(),
}));

vi.mock('../model/useCreateEvent', () => ({
  useCreateEvent: mocks.useCreateEvent,
}));

vi.mock('@shared/hooks/useModalTransition', () => ({
  useModalTransition: () => ({
    requestClose: mocks.requestClose,
    modalTransitionProps: { 'data-modal-state': 'open' },
  }),
}));

vi.mock('@/features/eventForm', () => ({
  EventFormModal: ({
    form,
    onClose,
  }: {
    form: { submit: { onSubmit: () => void } };
    onClose: () => void;
  }) => (
    <div role="dialog" aria-label="Create event">
      <button type="button" onClick={form.submit.onSubmit}>
        Share
      </button>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

import { CreateEventModal } from './CreateEventModal';

const createdEvent = { id: 42 } as BackendEvent;

const makeForm = () =>
  ({
    isPlan: false,
    category: { options: [], selected: null, onChange: vi.fn() },
    titleInput: { value: 'Catch up over coffee or matcha?', onChange: vi.fn() },
    locationInput: { value: 'Kyiv', onChange: vi.fn() },
    descriptionInput: { value: '', onChange: vi.fn() },
    timeframeInput: { value: 'This weekend', onChange: vi.fn() },
    hasRequiredFields: true,
    onTypeChange: vi.fn(),
    submit: { isSubmitting: false, onSubmit: vi.fn() },
  }) as unknown as EventFormModel;

describe('CreateEventModal launch transition', () => {
  const originalReportCreated = useOnboardingStore.getState().reportCreated;
  let form: EventFormModel;
  let reportCreated: Mock<(event: BackendEvent) => void>;
  let createdCallback!: (event: BackendEvent) => void;
  let submitStartedCallback!: () => void;
  let submitSettledCallback!: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );

    mocks.requestClose.mockReset();
    mocks.useCreateEvent.mockReset();
    form = makeForm();
    reportCreated = vi.fn<(event: BackendEvent) => void>();
    useOnboardingStore.setState({
      step: null,
      form: null,
      createdEvent: null,
      reportCreated,
    });
    useCreatedEventShareStore.setState({ event: null });
    useEventsRefreshStore.setState({
      refreshToken: 0,
      isDeferred: false,
      isPending: false,
      revealEventId: null,
    });
    mocks.useCreateEvent.mockImplementation(
      (onCreated, _defaultType, options) => {
        createdCallback = onCreated;
        submitStartedCallback = options.onSubmitStart;
        submitSettledCallback = options.onSubmitSettled;

        return form;
      },
    );
  });

  afterEach(() => {
    cleanup();
    useOnboardingStore.setState({
      step: null,
      form: null,
      createdEvent: null,
      reportCreated: originalReportCreated,
    });
    useCreatedEventShareStore.getState().close();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps the publishing animation visible for 1.1 seconds after a fast response', () => {
    render(<CreateEventModal onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.queryByRole('status')).toBeNull();
    expect(mocks.useCreateEvent).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      expect.objectContaining({
        showGlobalLoader: false,
        onSubmitStart: expect.any(Function),
        onSubmitSettled: expect.any(Function),
      }),
    );

    act(() => submitStartedCallback());

    expect(screen.getByRole('status').dataset.state).toBe('publishing');
    expect(screen.getByText('Setting your wish free…')).toBeTruthy();

    act(() => {
      createdCallback(createdEvent);
      submitSettledCallback();
    });

    act(() => vi.advanceTimersByTime(1099));

    expect(screen.getByRole('status').dataset.state).toBe('publishing');

    act(() => vi.advanceTimersByTime(1));

    expect(screen.getByRole('status').dataset.state).toBe('success');
  });

  it('holds the success beat before handing the event to the share flow', () => {
    const onCreated = vi.fn();

    render(<CreateEventModal onClose={vi.fn()} onCreated={onCreated} />);

    act(() => {
      submitStartedCallback();
      createdCallback(createdEvent);
      submitSettledCallback();
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByRole('status').dataset.state).toBe('success');
    expect(screen.getByText('Your wish is live!')).toBeTruthy();
    expect(reportCreated).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1399));

    expect(onCreated).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));

    expect(reportCreated).toHaveBeenCalledWith(createdEvent);
    expect(useCreatedEventShareStore.getState().event).toBe(createdEvent);
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it('leaves sharing to the onboarding flow when the event was created there', () => {
    useOnboardingStore.setState({ step: 'submit' });

    render(<CreateEventModal onClose={vi.fn()} onCreated={vi.fn()} />);

    act(() => {
      submitStartedCallback();
      createdCallback(createdEvent);
      submitSettledCallback();
      vi.advanceTimersByTime(2500);
    });

    expect(useCreatedEventShareStore.getState().event).toBeNull();
  });

  it('does not hold the feed refresh when onboarding owns the share modal', () => {
    useOnboardingStore.setState({ step: 'submit' });

    render(<CreateEventModal onClose={vi.fn()} onCreated={vi.fn()} />);

    act(() => {
      submitStartedCallback();
      createdCallback(createdEvent);
      submitSettledCallback();
      vi.advanceTimersByTime(2500);
    });

    expect(useEventsRefreshStore.getState().isDeferred).toBe(false);

    useEventsRefreshStore.getState().requestRefresh();

    expect(useEventsRefreshStore.getState().refreshToken).toBe(1);
  });

  it('holds the feed refresh for the share modal the layout always mounts', () => {
    render(<CreateEventModal onClose={vi.fn()} onCreated={vi.fn()} />);

    act(() => {
      submitStartedCallback();
      createdCallback(createdEvent);
      submitSettledCallback();
      vi.advanceTimersByTime(2500);
    });

    expect(useEventsRefreshStore.getState().isDeferred).toBe(true);
    expect(useEventsRefreshStore.getState().revealEventId).toBe('42');
  });

  it('keeps the regular close transition available before publishing', () => {
    render(<CreateEventModal onClose={vi.fn()} onCreated={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(mocks.requestClose).toHaveBeenCalledTimes(1);
  });
});
