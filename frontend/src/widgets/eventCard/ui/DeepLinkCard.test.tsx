// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type BackendEvent, GetEventError } from '@/shared/client_api/event';

const eventApiMocks = vi.hoisted(() => ({
  getEvent: vi.fn(),
}));

const uiMocks = vi.hoisted(() => ({
  eventCard: vi.fn(),
}));

vi.mock('@/shared/client_api/event', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/shared/client_api/event')>();

  return { ...actual, getEvent: eventApiMocks.getEvent };
});

vi.mock('./EventCard', () => ({
  EventCard: (props: {
    event: { title: string };
    onDetailsClose?: () => void;
  }) => {
    uiMocks.eventCard(props);

    return (
      <button type="button" onClick={props.onDetailsClose}>
        Loaded event: {props.event.title}
      </button>
    );
  },
}));

import { DeepLinkCard } from './DeepLinkCard';

const event: BackendEvent = {
  id: 73,
  creator: 'nina',
  creator_avatar: null,
  mutual_friend: null,
  category: null,
  event_type: 'wish',
  event_visibility: 'friends',
  status: 'active',
  title: 'Learn pottery',
  description: 'Find a weekend class',
  cover_image: null,
  location: 'Kyiv',
  external_link: null,
  event_date: null,
  event_time: null,
  timeframe_text: 'This autumn',
  min_participants: 1,
  max_participants: null,
  participants_count: 0,
  interested_count: 2,
  participants_preview: [],
  created_at: '2026-08-13T09:00:00Z',
  is_full: false,
  available_spots: null,
  user_participation_status: null,
};

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

describe('DeepLinkCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    eventApiMocks.getEvent.mockResolvedValue(event);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('loads the requested event and opens its details', async () => {
    const onClose = vi.fn();

    render(<DeepLinkCard eventId="73" onClose={onClose} />);
    await flushPromises();

    expect(eventApiMocks.getEvent).toHaveBeenCalledWith('73');
    expect(screen.getByText('Loaded event: Learn pottery')).toBeTruthy();
    expect(uiMocks.eventCard).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          id: '73',
          title: event.title,
          participantCount: 2,
        }),
        enableDetails: true,
        autoOpenDetails: true,
        detailsOnly: true,
      }),
    );

    fireEvent.click(screen.getByText('Loaded event: Learn pottery'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a 403 privacy toast for ten seconds', async () => {
    const onClose = vi.fn();

    eventApiMocks.getEvent.mockRejectedValueOnce(new GetEventError(403));

    render(<DeepLinkCard eventId="private" onClose={onClose} />);
    await flushPromises();

    const toast = screen.getByRole('status');

    expect(toast.textContent).toContain(
      'This event is only visible to the host',
    );

    await advance(9_999);
    expect(onClose).not.toHaveBeenCalled();

    await advance(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a dismissible notice for a generic loading error', async () => {
    const onClose = vi.fn();

    eventApiMocks.getEvent.mockRejectedValueOnce(new Error('offline'));

    render(<DeepLinkCard eventId="missing" onClose={onClose} />);
    await flushPromises();

    const notice = screen.getByRole('alertdialog');

    expect(notice.textContent).toContain('available right now');

    fireEvent.click(notice.parentElement as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps a generic error open on Escape and over time', async () => {
    const onClose = vi.fn();

    eventApiMocks.getEvent.mockRejectedValueOnce(new Error('offline'));

    render(<DeepLinkCard eventId="missing" onClose={onClose} />);
    await flushPromises();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    await advance(10_000);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeTruthy();
  });

  it('clears the privacy toast timer when the card unmounts', async () => {
    const onClose = vi.fn();

    eventApiMocks.getEvent.mockRejectedValueOnce(new GetEventError(403));

    const { unmount } = render(
      <DeepLinkCard eventId="missing" onClose={onClose} />,
    );

    await flushPromises();
    unmount();
    await advance(10_000);

    expect(onClose).not.toHaveBeenCalled();
  });
});
