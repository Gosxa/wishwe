// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const eventApiMocks = vi.hoisted(() => ({
  listCategories: vi.fn(),
  updateEvent: vi.fn(),
}));

const imageMocks = vi.hoisted(() => ({
  isAllowedCoverImage: vi.fn(),
  prepareCoverImage: vi.fn(),
}));

vi.mock('@/shared/client_api/event', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/client_api/event')>();

  return {
    ...actual,
    listCategories: eventApiMocks.listCategories,
    updateEvent: eventApiMocks.updateEvent,
  };
});

vi.mock('@/shared/lib/validation/imageUpload', () => ({
  isAllowedCoverImage: imageMocks.isAllowedCoverImage,
  MAX_COVER_IMAGE_SIZE: 5 * 1024 * 1024,
  prepareCoverImage: imageMocks.prepareCoverImage,
}));

import { type BackendEvent, UpdateEventError } from '@/shared/client_api/event';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useEditEvent } from './useEditEvent';

const categories = [
  { id: 7, name: 'Outdoors' },
  { id: 9, name: 'Culture' },
];

const futureDate = '2099-01-02';

const makeEvent = (overrides: Partial<BackendEvent> = {}): BackendEvent => ({
  id: 42,
  creator: 'maya',
  creator_avatar: null,
  mutual_friend: null,
  category: 'Outdoors',
  event_type: 'plan',
  event_visibility: 'f-o-f',
  status: 'active',
  title: 'Original title',
  description: 'Original description',
  cover_image: '/media/events/original.jpg',
  location: 'Kyiv',
  external_link: 'https://example.com/original-chat',
  event_date: futureDate,
  event_time: '10:15:00',
  timeframe_text: null,
  min_participants: 2,
  max_participants: 4,
  participants_count: 1,
  interested_count: 0,
  participants_preview: [],
  created_at: '2026-01-01T12:00:00Z',
  is_full: false,
  available_spots: 3,
  user_participation_status: null,
  ...overrides,
});

describe('useEditEvent', () => {
  const onSaved = vi.fn();
  const setLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    eventApiMocks.listCategories.mockResolvedValue(categories);
    eventApiMocks.updateEvent.mockResolvedValue({ id: 42 });
    imageMocks.isAllowedCoverImage.mockReturnValue(true);
    imageMocks.prepareCoverImage.mockImplementation(async file => file);
    useLoadingStore.setState({ isLoading: false, setLoading });

    vi.stubGlobal('URL', URL);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:edited-cover');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderEditHook = (event = makeEvent()) =>
    renderHook(() => useEditEvent(event, onSaved));

  it('initializes plan fields and resolves the category name to its id', async () => {
    const { result } = renderEditHook(
      makeEvent({ max_participants: 3000, event_time: '10:15:00' }),
    );

    await waitFor(() => expect(result.current.category.selected).toBe(7));

    expect(result.current.titleInput.value).toBe('Original title');
    expect(result.current.timeInput.value).toBe('10:15');
    expect(result.current.participants.unlimited).toBe(true);
    expect(result.current.participants.max).toBe(2);
    expect(result.current.cover.previewUrl).toBe(
      'http://localhost:8000/media/events/original.jpg',
    );
  });

  it('blocks invalid plan fields without calling the API', async () => {
    const { result } = renderEditHook();

    await waitFor(() => expect(result.current.category.selected).toBe(7));

    act(() => {
      result.current.titleInput.onChange('');
      result.current.locationInput.onChange('');
      result.current.dateInput.onChange('');
      result.current.timeInput.onChange('');
      result.current.participants.onMinChange(4);
      result.current.participants.onUnlimitedChange(false);
      result.current.participants.onMaxChange(3);
    });

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.titleInput.error).toBe('Title is required');
    expect(result.current.locationInput.error).toBe('Location is required');
    expect(result.current.dateInput.error).toBe('Date is required');
    expect(result.current.timeInput.error).toBe('Time is required');
    expect(result.current.participants.maxError).toBe(
      'Max cannot be less than min',
    );
    expect(eventApiMocks.updateEvent).not.toHaveBeenCalled();
  });

  it('submits the edited plan payload and restores loading state', async () => {
    const { result } = renderEditHook();

    await waitFor(() => expect(result.current.category.selected).toBe(7));

    act(() => {
      result.current.category.onChange(9);
      result.current.titleInput.onChange('  Updated title  ');
      result.current.locationInput.onChange('  Lviv  ');
      result.current.descriptionInput.onChange('Updated description');
      result.current.dateInput.onChange(futureDate);
      result.current.timeInput.onChange('18:45');
      result.current.participants.onMinChange(3);
      result.current.participants.onUnlimitedChange(false);
      result.current.participants.onMaxChange(6);
      result.current.chatLinkInput.onChange(' https://example.com/new-chat ');
    });

    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.updateEvent).toHaveBeenCalledWith('42', 'plan', {
      category: 9,
      title: 'Updated title',
      description: 'Updated description',
      location: 'Lviv',
      event_date: futureDate,
      event_time: '18:45',
      min_participants: 3,
      max_participants: 6,
      external_link: 'https://example.com/new-chat',
    });
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(onSaved).toHaveBeenCalledOnce();
    expect(result.current.submit.isSubmitting).toBe(false);
  });

  it('validates the submitted title after trimming surrounding whitespace', async () => {
    const { result } = renderEditHook();

    await waitFor(() => expect(result.current.category.selected).toBe(7));
    const maxLengthTitle = 'x'.repeat(50);

    act(() => result.current.titleInput.onChange(`  ${maxLengthTitle}  `));

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.titleInput.error).toBeUndefined();
    expect(eventApiMocks.updateEvent).toHaveBeenCalledWith(
      '42',
      'plan',
      expect.objectContaining({ title: maxLengthTitle }),
    );
  });

  it('submits wish fields without plan-only values', async () => {
    const wish = makeEvent({
      event_type: 'wish',
      event_date: null,
      event_time: null,
      external_link: null,
      timeframe_text: 'Next summer',
      max_participants: null,
    });
    const { result } = renderEditHook(wish);

    await waitFor(() => expect(result.current.category.selected).toBe(7));

    act(() => {
      result.current.timeframeInput.onChange('  When everyone is free  ');
      result.current.participants.onMinChange(4);
    });

    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.updateEvent).toHaveBeenCalledWith('42', 'wish', {
      category: 7,
      title: 'Original title',
      description: 'Original description',
      location: 'Kyiv',
      min_participants: 4,
      timeframe_text: 'When everyone is free',
    });
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it('sends a prepared replacement cover as multipart data', async () => {
    const { result } = renderEditHook();

    await waitFor(() => expect(result.current.category.selected).toBe(7));
    const cover = new File(['replacement'], 'replacement.webp', {
      type: 'image/webp',
    });

    await act(async () => result.current.cover.onSelect(cover));
    await act(async () => result.current.submit.onSubmit());

    expect(imageMocks.prepareCoverImage).toHaveBeenCalledWith(cover);
    expect(result.current.cover.previewUrl).toBe('blob:edited-cover');

    const payload = eventApiMocks.updateEvent.mock.calls[0][2];

    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('title')).toBe('Original title');
    expect(payload.get('cover_image')).toBe(cover);
  });

  it('maps backend errors and keeps the original event unsaved', async () => {
    eventApiMocks.updateEvent.mockRejectedValue(
      new UpdateEventError({
        error: {
          event_date: ['Choose a later date.'],
          cover_image: ['The image could not be stored.'],
          detail: 'Update rejected.',
        },
      }),
    );
    const { result } = renderEditHook();

    await waitFor(() => expect(result.current.category.selected).toBe(7));

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.dateInput.error).toBe('Choose a later date.');
    expect(result.current.cover.error).toBe('The image could not be stored.');
    expect(result.current.submit.error).toBe('Update rejected.');
    expect(onSaved).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(result.current.submit.isSubmitting).toBe(false);
  });
});
