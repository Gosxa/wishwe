// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  FeedEvent,
  ParticipantAvatar,
} from '@client_pages/home/model/types';
import type { EventParticipation } from '../model/useEventParticipation';

const participantsModalMock = vi.hoisted(() => vi.fn());

vi.mock('./ParticipantsModal', () => ({
  ParticipantsModal: (props: Record<string, unknown>) => {
    participantsModalMock(props);

    return (
      <div data-testid="participants-modal">
        <button type="button" onClick={props.onClose as () => void}>
          Close participants
        </button>
      </div>
    );
  },
}));

import { EventDetailsModal } from './EventDetailsModal';

const avatars = (count: number): ParticipantAvatar[] =>
  Array.from({ length: count }, (_, index) => ({
    username: `@guest${index}`,
    avatar: index === 0 ? null : `https://cdn.example/${index}.png`,
  }));

const feedEvent = (overrides: Partial<FeedEvent> = {}): FeedEvent => ({
  id: '42',
  type: 'plan',
  hashtag: '#travel',
  image: '/cover.jpg',
  title: 'Weekend trip',
  host: { username: '@host', avatar: null },
  date: 'Friday, August 14',
  startsAt: Date.parse('2026-08-14T12:00:00Z'),
  createdAt: Date.parse('2026-08-12T12:00:00Z'),
  location: 'Kyiv',
  description: 'A short trip with friends',
  chatLink: 'https://chat.example/trip',
  participantCount: 0,
  maxParticipants: 10,
  participants: [],
  userParticipationStatus: null,
  ...overrides,
});

const participation = (
  overrides: Partial<EventParticipation> = {},
): EventParticipation => ({
  count: 0,
  participants: [],
  isPending: false,
  isParticipating: false,
  actionLabel: 'Join',
  selectedLabel: 'Joined',
  join: vi.fn(),
  leave: vi.fn(),
  ...overrides,
});

const renderModal = (
  props: Partial<ComponentProps<typeof EventDetailsModal>> = {},
) =>
  render(
    <EventDetailsModal
      event={feedEvent()}
      participation={participation()}
      onAction={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />,
  );

const dialog = () => screen.getByRole('dialog', { hidden: true });

describe('EventDetailsModal', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    participantsModalMock.mockClear();
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('left');
    document.body.style.removeProperty('right');
    document.body.style.removeProperty('padding-right');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the event details supplied by the feed', () => {
    renderModal();

    expect(screen.getByText('Weekend trip')).toBeTruthy();
    expect(screen.getByText('Friday, August 14')).toBeTruthy();
    expect(screen.getByText('Kyiv')).toBeTruthy();
    expect(screen.getByText('A short trip with friends')).toBeTruthy();
    expect(
      (screen.getByAltText('Weekend trip') as HTMLImageElement).getAttribute(
        'src',
      ),
    ).toBe('/cover.jpg');
  });

  it('links a map-pinned address to the exact Google place', () => {
    renderModal({
      event: feedEvent({ locationPlaceId: 'ChIJ123' }),
    });

    const link = screen.getByRole('link', {
      name: /open kyiv in google maps/i,
    });
    const url = new URL(link.getAttribute('href') as string);

    expect(url.searchParams.get('query_place_id')).toBe('ChIJ123');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('falls back to a hint when the host added no description', () => {
    renderModal({ event: feedEvent({ description: '' }) });

    expect(screen.getByText('No details added by the host')).toBeTruthy();
  });

  it('hides the chat link until the user has joined', () => {
    renderModal();

    expect(screen.getByText('Link available after joining')).toBeTruthy();
    expect(screen.queryByText('https://chat.example/trip')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Open chat' })).toBeNull();
  });

  it('reveals the chat link and an open-chat link once participating', () => {
    renderModal({ participation: participation({ isParticipating: true }) });

    expect(screen.getByText('https://chat.example/trip')).toBeTruthy();

    const openChat = screen.getByRole('link', { name: 'Open chat' });

    expect(openChat.getAttribute('href')).toBe('https://chat.example/trip');
    expect(openChat.getAttribute('target')).toBe('_blank');
    expect(openChat.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('tells participants when the host provided no chat link', () => {
    renderModal({
      event: feedEvent({ chatLink: '' }),
      participation: participation({ isParticipating: true }),
    });

    expect(screen.getByText('No link provided :(')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Open chat' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy chat link' })).toBeNull();
  });

  it('copies the chat link and restores the label after the confirmation delay', async () => {
    vi.useFakeTimers();
    renderModal({ participation: participation({ isParticipating: true }) });

    const copy = screen.getByRole('button', { name: 'Copy chat link' });

    await act(async () => {
      fireEvent.click(copy);
    });

    expect(writeText).toHaveBeenCalledWith('https://chat.example/trip');
    expect(screen.getByText('Link Copied')).toBeTruthy();
    expect(screen.queryByText('https://chat.example/trip')).toBeNull();
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Link Copied')).toBeNull();
    expect(screen.getByText('https://chat.example/trip')).toBeTruthy();
  });

  it('keeps the original label when the clipboard write is rejected', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    renderModal({ participation: participation({ isParticipating: true }) });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy chat link' }));
    });

    expect(screen.queryByText('Link Copied')).toBeNull();
    expect(screen.getByText('https://chat.example/trip')).toBeTruthy();
  });

  it('invites the first participant when nobody has joined', () => {
    renderModal();

    expect(screen.getByText('Be the first to join')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '0/10' })).toBeNull();
  });

  it('shows at most six stacked avatars and a filled counter', () => {
    renderModal({
      participation: participation({ count: 8, participants: avatars(8) }),
    });

    expect(screen.queryByAltText('@guest0')).toBeNull();
    for (const index of [1, 2, 3, 4, 5]) {
      expect(screen.getByAltText(`@guest${index}`)).toBeTruthy();
    }

    expect(screen.queryByAltText('@guest6')).toBeNull();
    expect(screen.queryByAltText('@guest7')).toBeNull();
    expect(screen.getByRole('button', { name: '8/10' })).toBeTruthy();
  });

  it('drops the cap from the counter when the event has no limit', () => {
    renderModal({
      event: feedEvent({ maxParticipants: null }),
      participation: participation({ count: 3, participants: avatars(3) }),
    });

    expect(screen.getByRole('button', { name: '3' })).toBeTruthy();
  });

  it('treats an effectively unlimited cap as no cap', () => {
    renderModal({
      event: feedEvent({ maxParticipants: 3000 }),
      participation: participation({ count: 3, participants: avatars(3) }),
    });

    expect(screen.getByRole('button', { name: '3' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '3/3000' })).toBeNull();
  });

  it('opens the participants modal from the counter and hides the details behind it', () => {
    renderModal({
      participation: participation({ count: 2, participants: avatars(2) }),
    });

    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(dialog().hasAttribute('inert')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: '2/10' }));

    expect(screen.getByTestId('participants-modal')).toBeTruthy();
    expect(participantsModalMock.mock.calls[0][0]).toMatchObject({
      eventId: '42',
      initialParticipants: avatars(2),
    });
    expect(dialog().getAttribute('aria-hidden')).toBe('true');
    expect(dialog().hasAttribute('aria-modal')).toBe(false);
    expect(dialog().hasAttribute('inert')).toBe(true);
  });

  it('restores the details modal and the counter focus when the participants modal closes', () => {
    renderModal({
      participation: participation({ count: 2, participants: avatars(2) }),
    });

    fireEvent.click(screen.getByRole('button', { name: '2/10' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close participants' }));

    expect(screen.queryByTestId('participants-modal')).toBeNull();
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(dialog().hasAttribute('inert')).toBe(false);

    const returnFocusRef = participantsModalMock.mock.calls[0][0]
      .returnFocusRef as { current: HTMLElement | null };

    expect(returnFocusRef.current).toBe(
      screen.getByRole('button', { name: '2/10' }),
    );
  });

  it('hides the details behind another modal while it is inactive', () => {
    renderModal({ isInactive: true });

    expect(dialog().getAttribute('aria-hidden')).toBe('true');
    expect(dialog().hasAttribute('inert')).toBe(true);
  });

  it('runs the join action from the primary button', () => {
    const onAction = vi.fn();

    renderModal({ onAction });

    const action = screen.getByRole('button', { name: 'Join' });

    fireEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect((action as HTMLButtonElement).disabled).toBe(false);
  });

  it('offers the interest wording for a wish', () => {
    renderModal({
      event: feedEvent({ type: 'wish' }),
      participation: participation({
        actionLabel: 'Interested',
        selectedLabel: 'Interested',
      }),
    });

    expect(screen.getByRole('button', { name: 'Interested' })).toBeTruthy();
  });

  it('offers leaving once the user participates', () => {
    const onAction = vi.fn();

    renderModal({
      onAction,
      participation: participation({ isParticipating: true }),
    });

    const action = screen.getByRole('button', { name: /Leave/ });

    expect(action.textContent).toContain('Joined');

    fireEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('blocks the action button while a request is in flight', () => {
    const onAction = vi.fn();

    renderModal({
      onAction,
      participation: participation({ isPending: true }),
    });

    const action = screen.getByRole('button', { name: 'Join' });

    expect((action as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(action);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('closes from the close button but not from an overlay click', () => {
    const onClose = vi.fn();

    renderModal({ onClose });

    const overlay = dialog().parentElement as HTMLElement;

    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scrolling while open and restores it on close', () => {
    const { unmount } = renderModal();

    expect(document.body.style.position).toBe('fixed');

    unmount();
    expect(document.body.style.position).toBe('');
  });
});
