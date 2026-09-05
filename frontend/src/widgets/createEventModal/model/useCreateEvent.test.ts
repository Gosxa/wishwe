// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const eventApiMocks = vi.hoisted(() => ({
  createEvent: vi.fn(),
  listCategories: vi.fn(),
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
    createEvent: eventApiMocks.createEvent,
    listCategories: eventApiMocks.listCategories,
  };
});

vi.mock('@/shared/lib/validation/imageUpload', () => ({
  isAllowedCoverImage: imageMocks.isAllowedCoverImage,
  MAX_COVER_IMAGE_SIZE: 5 * 1024 * 1024,
  prepareCoverImage: imageMocks.prepareCoverImage,
}));

import { CreateEventError } from '@/shared/client_api/event';
import { MAX_COVER_IMAGE_SIZE } from '@/shared/lib/validation/imageUpload';
import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { useCreateEvent } from './useCreateEvent';

const categories = [
  { id: 7, name: 'Outdoors' },
  { id: 9, name: 'Culture' },
];

const futureDate = '2099-01-02';

describe('useCreateEvent', () => {
  const onCreated = vi.fn();
  const setLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    eventApiMocks.listCategories.mockResolvedValue(categories);
    eventApiMocks.createEvent.mockResolvedValue({ id: 123 });
    imageMocks.isAllowedCoverImage.mockReturnValue(true);
    imageMocks.prepareCoverImage.mockImplementation(async file => file);
    useLoadingStore.setState({ isLoading: false, setLoading });

    vi.stubGlobal('URL', URL);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cover-preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderCreateHook = (
    defaultType: 'plan' | 'wish' = 'plan',
    options: {
      showGlobalLoader?: boolean;
      onSubmitStart?: () => void;
      onSubmitSettled?: () => void;
    } = {},
  ) => renderHook(() => useCreateEvent(onCreated, defaultType, options));

  const fillValidPlan = (
    result: ReturnType<typeof renderCreateHook>['result'],
  ) => {
    act(() => {
      result.current.category.onChange(7);
      result.current.titleInput.onChange('  Mountain walk  ');
      result.current.locationInput.onChange('  Carpathians  ');
      result.current.descriptionInput.onChange('Bring water');
      result.current.dateInput.onChange(futureDate);
      result.current.timeInput.onChange('14:30');
      result.current.participants.onMinChange(3);
      result.current.participants.onUnlimitedChange(false);
      result.current.participants.onMaxChange(5);
      result.current.chatLinkInput.onChange('https://example.com/chat');
      result.current.visibility.onChange('friends-only');
    });
  };

  it('loads categories and reports all required plan fields without submitting', async () => {
    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.options).toEqual(categories),
    );

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.category.error).toBe('Category is required');
    expect(result.current.titleInput.error).toBe('Title is required');
    expect(result.current.locationInput.error).toBe('Location is required');
    expect(result.current.dateInput.error).toBe('Date is required');
    expect(result.current.timeInput.error).toBe('Time is required');
    expect(eventApiMocks.createEvent).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it('reports a category loading failure', async () => {
    eventApiMocks.listCategories.mockRejectedValueOnce(
      new Error('categories unavailable'),
    );

    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.error).toBe(
        'Failed to load categories. Please try again.',
      ),
    );
    expect(result.current.category.options).toEqual([]);
  });

  it('submits a trimmed plan payload and restores loading state', async () => {
    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );
    fillValidPlan(result);

    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.createEvent).toHaveBeenCalledWith('plan', {
      category: 7,
      title: 'Mountain walk',
      location: 'Carpathians',
      description: 'Bring water',
      event_date: futureDate,
      event_time: '14:30',
      min_participants: 3,
      max_participants: 5,
      external_link: 'https://example.com/chat',
      event_visibility: 'friends-only',
    });
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(onCreated).toHaveBeenCalledOnce();
    expect(result.current.submit.isSubmitting).toBe(false);
  });

  it('submits the Place ID when the location was picked on Google Maps', async () => {
    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );
    fillValidPlan(result);

    act(() => {
      result.current.locationPicker.apply({
        lat: 50.438,
        lng: 30.515,
        formatted: 'Velyka Vasylkivska St, 100, Kyiv',
        placeId: 'ChIJ123',
      });
    });

    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.createEvent).toHaveBeenCalledWith(
      'plan',
      expect.objectContaining({
        location: 'Velyka Vasylkivska St, 100, Kyiv',
        location_place_id: 'ChIJ123',
      }),
    );
  });

  it('drops the Place ID when a pinned address is edited by hand', async () => {
    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );
    fillValidPlan(result);

    act(() => {
      result.current.locationPicker.apply({
        lat: 50.438,
        lng: 30.515,
        formatted: 'Velyka Vasylkivska St, 100, Kyiv',
        placeId: 'ChIJ123',
      });
    });

    act(() => {
      result.current.locationInput.onChange(
        'Velyka Vasylkivska St, 100, meet by the door',
      );
    });

    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.createEvent).toHaveBeenCalledWith(
      'plan',
      expect.not.objectContaining({ location_place_id: expect.anything() }),
    );
  });

  it('can leave loading feedback to a local transition', async () => {
    const onSubmitStart = vi.fn();
    const onSubmitSettled = vi.fn();
    const { result } = renderCreateHook('plan', {
      showGlobalLoader: false,
      onSubmitStart,
      onSubmitSettled,
    });

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );
    fillValidPlan(result);

    await act(async () => result.current.submit.onSubmit());

    expect(setLoading).not.toHaveBeenCalled();
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onSubmitStart).toHaveBeenCalledOnce();
    expect(onSubmitSettled).toHaveBeenCalledOnce();
  });

  it('validates the submitted title after trimming surrounding whitespace', async () => {
    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );
    fillValidPlan(result);
    const maxLengthTitle = 'x'.repeat(50);

    act(() => result.current.titleInput.onChange(`  ${maxLengthTitle}  `));

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.titleInput.error).toBeUndefined();
    expect(eventApiMocks.createEvent).toHaveBeenCalledWith(
      'plan',
      expect.objectContaining({ title: maxLengthTitle }),
    );
  });

  it('submits a wish without plan-only fields', async () => {
    const { result } = renderCreateHook('wish');

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );

    act(() => {
      result.current.category.onChange(9);
      result.current.titleInput.onChange('See the northern lights');
      result.current.locationInput.onChange('Norway');
      result.current.timeframeInput.onChange('Someday this winter');
      result.current.participants.onMinChange(2);
    });

    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.createEvent).toHaveBeenCalledWith('wish', {
      category: 9,
      title: 'See the northern lights',
      location: 'Norway',
      min_participants: 2,
      timeframe_text: 'Someday this winter',
      event_visibility: 'f-o-f',
    });
    expect(onCreated).toHaveBeenCalledOnce();
  });

  it('builds multipart data after preparing a selected cover', async () => {
    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );
    fillValidPlan(result);
    const cover = new File(['image'], 'cover.png', { type: 'image/png' });

    await act(async () => result.current.cover.onSelect(cover));
    await act(async () => result.current.submit.onSubmit());

    expect(imageMocks.prepareCoverImage).toHaveBeenCalledWith(cover);
    expect(result.current.cover.previewUrl).toBe('blob:cover-preview');

    const payload = eventApiMocks.createEvent.mock.calls[0][1];

    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('title')).toBe('Mountain walk');
    expect(payload.get('category')).toBe('7');
    expect(payload.get('cover_image')).toBe(cover);
  });

  it('rejects an unsupported cover before attempting preparation', async () => {
    imageMocks.isAllowedCoverImage.mockReturnValue(false);
    const { result } = renderCreateHook();
    const cover = new File(['image'], 'cover.gif', { type: 'image/gif' });

    await act(async () => result.current.cover.onSelect(cover));

    expect(result.current.cover.error).toBe('Unsupported image format');
    expect(imageMocks.prepareCoverImage).not.toHaveBeenCalled();
    expect(result.current.cover.isProcessing).toBe(false);
  });

  it('clears a previously selected cover when the next selection is rejected', async () => {
    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );
    fillValidPlan(result);

    const validCover = new File(['image'], 'cover.png', { type: 'image/png' });
    const invalidCover = new File(['image'], 'cover.gif', {
      type: 'image/gif',
    });

    await act(async () => result.current.cover.onSelect(validCover));
    imageMocks.isAllowedCoverImage.mockReturnValue(false);
    await act(async () => result.current.cover.onSelect(invalidCover));
    await act(async () => result.current.submit.onSubmit());

    expect(eventApiMocks.createEvent.mock.calls[0][1]).not.toBeInstanceOf(
      FormData,
    );
  });

  it('accepts the size limit and rejects a file one byte over it', async () => {
    const { result } = renderCreateHook();
    const oversizedCover = new File(
      [new Uint8Array(MAX_COVER_IMAGE_SIZE + 1)],
      'oversized.png',
      { type: 'image/png' },
    );

    await act(async () => result.current.cover.onSelect(oversizedCover));

    expect(result.current.cover.error).toBe('Image must be 5 MB or less');
    expect(imageMocks.prepareCoverImage).not.toHaveBeenCalled();

    const boundaryCover = new File(
      [new Uint8Array(MAX_COVER_IMAGE_SIZE)],
      'at-limit.png',
      { type: 'image/png' },
    );

    await act(async () => result.current.cover.onSelect(boundaryCover));

    expect(imageMocks.prepareCoverImage).toHaveBeenCalledWith(boundaryCover);
    expect(result.current.cover.error).toBeUndefined();
    expect(result.current.cover.previewUrl).toBe('blob:cover-preview');
  });

  it('rejects a converted image that exceeds the size limit', async () => {
    const convertedCover = new File(
      [new Uint8Array(MAX_COVER_IMAGE_SIZE + 1)],
      'converted.jpg',
      { type: 'image/jpeg' },
    );

    imageMocks.prepareCoverImage.mockResolvedValue(convertedCover);
    const { result } = renderCreateHook();
    const heicCover = new File(['heic'], 'cover.heic', {
      type: 'image/heic',
    });

    await act(async () => result.current.cover.onSelect(heicCover));

    expect(result.current.cover.error).toBe(
      'Converted image must be 5 MB or less',
    );
    expect(result.current.cover.previewUrl).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(result.current.cover.isProcessing).toBe(false);
  });

  it('surfaces an image preparation failure and restores processing state', async () => {
    imageMocks.prepareCoverImage.mockRejectedValue(new Error('decode failed'));
    const { result } = renderCreateHook();
    const heicCover = new File(['heic'], 'broken.heic', {
      type: 'image/heic',
    });

    await act(async () => result.current.cover.onSelect(heicCover));

    expect(result.current.cover.error).toBe('Could not process this image');
    expect(result.current.cover.previewUrl).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(result.current.cover.isProcessing).toBe(false);
  });

  it('maps nested backend field errors and always clears loading state', async () => {
    eventApiMocks.createEvent.mockRejectedValue(
      new CreateEventError({
        error: {
          title: ['This title already exists.'],
          external_link: ['Only HTTPS links are allowed.'],
          non_field_errors: ['The event could not be created.'],
        },
      }),
    );
    const { result } = renderCreateHook();

    await waitFor(() =>
      expect(result.current.category.options).toHaveLength(2),
    );
    fillValidPlan(result);

    await act(async () => result.current.submit.onSubmit());

    expect(result.current.titleInput.error).toBe('This title already exists.');
    expect(result.current.chatLinkInput.error).toBe(
      'Only HTTPS links are allowed.',
    );
    expect(result.current.submit.error).toBe('The event could not be created.');
    expect(onCreated).not.toHaveBeenCalled();
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(result.current.submit.isSubmitting).toBe(false);
  });
});
