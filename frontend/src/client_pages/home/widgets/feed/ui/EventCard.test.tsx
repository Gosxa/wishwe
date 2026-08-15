// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendEvent } from '@/shared/client_api/event';
import type { FeedEvent } from '@client_pages/home/model/types';

const apiMocks = vi.hoisted(() => ({
  archiveEvent: vi.fn(),
  createShareLink: vi.fn(),
  expressInterest: vi.fn(),
  joinPlan: vi.fn(),
  leaveEvent: vi.fn(),
  listParticipants: vi.fn(),
}));

const shareImageMocks = vi.hoisted(() => ({
  generateShareImages: vi.fn(),
}));

vi.mock('@/shared/client_api/event', () => ({
  archiveEvent: apiMocks.archiveEvent,
  createShareLink: apiMocks.createShareLink,
  expressInterest: apiMocks.expressInterest,
  joinPlan: apiMocks.joinPlan,
  leaveEvent: apiMocks.leaveEvent,
  listParticipants: apiMocks.listParticipants,
}));

vi.mock('@/features', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('@client_pages/home/model/shareImage', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@client_pages/home/model/shareImage')
    >();

  return {
    ...actual,
    generateShareImages: shareImageMocks.generateShareImages,
  };
});

import { EventCard } from './EventCard';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

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

const backendEvent = (overrides: Partial<BackendEvent> = {}): BackendEvent => ({
  id: 42,
  creator: 'host',
  creator_avatar: null,
  mutual_friend: null,
  category: 'Travel',
  event_type: 'plan',
  event_visibility: 'public',
  status: 'active',
  title: 'Weekend trip',
  description: 'A short trip with friends',
  cover_image: '/cover.jpg',
  location: 'Kyiv',
  external_link: 'https://chat.example/trip',
  event_date: '2026-08-14',
  event_time: '12:00:00',
  timeframe_text: null,
  min_participants: 1,
  max_participants: 10,
  participants_count: 0,
  interested_count: 0,
  participants_preview: [],
  created_at: '2026-08-12T12:00:00Z',
  is_full: false,
  available_spots: 10,
  user_participation_status: null,
  ...overrides,
});

const renderCard = (props: Partial<ComponentProps<typeof EventCard>> = {}) =>
  render(<EventCard event={feedEvent()} {...props} />);

const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsText(blob);
  });

describe('EventCard', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>;
  let clipboardWriteText: ReturnType<typeof vi.fn>;
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiMocks.archiveEvent.mockReset();
    apiMocks.createShareLink.mockReset();
    apiMocks.expressInterest.mockReset();
    apiMocks.joinPlan.mockReset();
    apiMocks.leaveEvent.mockReset();
    apiMocks.listParticipants.mockReset();
    shareImageMocks.generateShareImages.mockReset();

    apiMocks.archiveEvent.mockResolvedValue(undefined);
    apiMocks.createShareLink.mockResolvedValue(
      'https://api.example.test/share/default',
    );
    apiMocks.expressInterest.mockResolvedValue(
      backendEvent({
        event_type: 'wish',
        user_participation_status: 'interested',
        interested_count: 1,
      }),
    );
    apiMocks.joinPlan.mockResolvedValue(
      backendEvent({
        user_participation_status: 'joined',
        participants_count: 1,
      }),
    );
    apiMocks.leaveEvent.mockResolvedValue(backendEvent());
    apiMocks.listParticipants.mockResolvedValue([]);
    shareImageMocks.generateShareImages.mockResolvedValue([
      { format: 'poster', blob: new Blob(['poster'], { type: 'image/png' }) },
      { format: 'card', blob: new Blob(['card'], { type: 'image/png' }) },
      { format: 'story', blob: new Blob(['story'], { type: 'image/png' }) },
    ]);

    clipboardWrite = vi.fn().mockResolvedValue(undefined);
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: clipboardWrite,
        writeText: clipboardWriteText,
      },
    });
    vi.stubGlobal('ClipboardItem', undefined);

    createObjectUrl = vi
      .fn()
      .mockImplementation((blob: Blob) => `blob:${blob.size}`);
    revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('joins a plan and applies the returned count and participant preview', async () => {
    apiMocks.joinPlan.mockResolvedValueOnce(
      backendEvent({
        user_participation_status: 'joined',
        participants_count: 4,
        available_spots: 6,
        participants_preview: [
          { username: 'alice', avatar: '/alice.jpg' },
          { username: 'bob', avatar: null },
          { username: 'carol', avatar: '/carol.jpg' },
        ],
      }),
    );
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Join' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /joined/i })).toBeTruthy(),
    );

    expect(apiMocks.joinPlan).toHaveBeenCalledWith('42');
    expect(apiMocks.expressInterest).not.toHaveBeenCalled();
    expect(screen.queryByText('Be the first to join')).toBeNull();
    expect(screen.getByRole('img', { name: '@alice' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '@carol' })).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('uses the interested action for a wish', async () => {
    apiMocks.expressInterest.mockResolvedValueOnce(
      backendEvent({
        event_type: 'wish',
        event_date: null,
        event_time: null,
        timeframe_text: 'Someday',
        user_participation_status: 'interested',
        interested_count: 2,
        participants_preview: [{ username: 'alice', avatar: '/alice.jpg' }],
      }),
    );
    renderCard({ event: feedEvent({ type: 'wish' }) });

    fireEvent.click(screen.getByRole('button', { name: 'Interested' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /interested.*leave/i }),
      ).toBeTruthy(),
    );

    expect(apiMocks.expressInterest).toHaveBeenCalledWith('42');
    expect(apiMocks.joinPlan).not.toHaveBeenCalled();
    expect(screen.getByRole('img', { name: '@alice' })).toBeTruthy();
  });

  it('asks for confirmation before leaving and applies the response', async () => {
    apiMocks.leaveEvent.mockResolvedValueOnce(
      backendEvent({
        participants_count: 1,
        participants_preview: [{ username: 'bob', avatar: '/bob.jpg' }],
      }),
    );
    renderCard({
      event: feedEvent({
        participantCount: 2,
        participants: [
          { username: '@alice', avatar: '/alice.jpg' },
          { username: '@bob', avatar: '/bob.jpg' },
        ],
        userParticipationStatus: 'joined',
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: /joined.*leave/i }));

    let dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('Leave this event?')).toBeTruthy();
    expect(apiMocks.leaveEvent).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'No, thanks' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /joined.*leave/i }));
    dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Leave' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    expect(apiMocks.leaveEvent).toHaveBeenCalledWith('42');
    expect(screen.getByRole('button', { name: 'Join' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '@bob' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: '@alice' })).toBeNull();
  });

  it('keeps the join state unchanged when joining fails', async () => {
    apiMocks.joinPlan.mockRejectedValueOnce(new Error('join failed'));
    renderCard();

    const button = screen.getByRole('button', { name: 'Join' });

    fireEvent.click(button);

    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false),
    );

    expect(apiMocks.joinPlan).toHaveBeenCalledWith('42');
    expect(screen.getByRole('button', { name: 'Join' })).toBeTruthy();
    expect(screen.getByText('Be the first to join')).toBeTruthy();
  });

  it('keeps the leave dialog and participation state when leaving fails', async () => {
    apiMocks.leaveEvent.mockRejectedValueOnce(new Error('leave failed'));
    renderCard({
      event: feedEvent({
        participantCount: 1,
        participants: [{ username: '@alice', avatar: '/alice.jpg' }],
        userParticipationStatus: 'joined',
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: /joined.*leave/i }));

    const dialog = screen.getByRole('dialog');
    const leaveButton = within(dialog).getByRole('button', { name: 'Leave' });

    fireEvent.click(leaveButton);

    await waitFor(() =>
      expect((leaveButton as HTMLButtonElement).disabled).toBe(false),
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('button', { name: /joined.*leave/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: '@alice' })).toBeTruthy();
  });

  it('shows owner edit and plan-it controls with the event id', () => {
    const onEdit = vi.fn();
    const onPlanIt = vi.fn();
    const view = renderCard({
      event: feedEvent({ type: 'wish' }),
      isOwn: true,
      onEdit,
      onPlanIt,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Plan it' }));

    expect(onEdit).toHaveBeenCalledWith('42');
    expect(onPlanIt).toHaveBeenCalledWith('42');
    expect(screen.queryByRole('button', { name: 'Interested' })).toBeNull();

    view.rerender(
      <EventCard
        event={feedEvent({ type: 'plan' })}
        isOwn
        onEdit={onEdit}
        onPlanIt={onPlanIt}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Plan it' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  });

  it('opens an archived recap and closes it with Escape', async () => {
    renderCard({
      event: feedEvent({
        participantCount: 4,
        participants: [
          { username: '@alice', avatar: '/alice.jpg' },
          { username: '@bob', avatar: null },
          { username: '@carol', avatar: null },
        ],
      }),
      isArchived: true,
      isOwn: true,
    });

    expect(screen.queryByRole('button', { name: 'Event options' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'View recap' }));

    const dialog = screen.getByRole('dialog', { name: 'Weekend trip' });

    expect(within(dialog).getByText('Who was there:')).toBeTruthy();
    expect(within(dialog).getByText('+1')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('opens details from the card and closes by backdrop or Escape', async () => {
    const onDetailsOpen = vi.fn();
    const onDetailsClose = vi.fn();

    renderCard({
      event: feedEvent({
        participantCount: 2,
        participants: [
          { username: '@alice', avatar: '/alice.jpg' },
          { username: '@bob', avatar: null },
        ],
      }),
      enableDetails: true,
      onDetailsOpen,
      onDetailsClose,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Weekend trip' }));

    let dialog = screen.getByRole('dialog', { name: 'Weekend trip' });

    expect(onDetailsOpen).toHaveBeenCalledTimes(1);
    expect(within(dialog).getByText('2/10')).toBeTruthy();

    fireEvent.click(dialog.parentElement as HTMLElement);

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onDetailsClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Friday, August 14'));
    dialog = screen.getByRole('dialog', { name: 'Weekend trip' });

    expect(dialog).toBeTruthy();
    expect(onDetailsOpen).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onDetailsClose).toHaveBeenCalledTimes(2);
  });

  it('opens sharing without copying, then copies the feed fallback', async () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Event options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share Event' }));

    const dialog = screen.getByRole('dialog', { name: 'Share this plan' });

    expect(within(dialog).getByText('Post it or send the link')).toBeTruthy();
    expect(clipboardWriteText).not.toHaveBeenCalled();
    expect(apiMocks.createShareLink).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Copy link' }));

    await waitFor(() =>
      expect(clipboardWriteText).toHaveBeenCalledWith(
        `${window.location.origin}/feed?event=42`,
      ),
    );

    expect(apiMocks.createShareLink).not.toHaveBeenCalled();
    expect(clipboardWrite).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'Share this plan' }),
    ).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Link Copied!');
  });

  it('closes sharing with Escape and returns focus to event options', async () => {
    renderCard();

    const trigger = screen.getByRole('button', { name: 'Event options' });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share Event' }));

    expect(
      screen.getByRole('dialog', { name: 'Share this plan' }),
    ).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('closes sharing from the backdrop without opening event details', async () => {
    const onDetailsOpen = vi.fn();

    renderCard({ enableDetails: true, onDetailsOpen });

    fireEvent.click(screen.getByRole('button', { name: 'Event options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share Event' }));

    const shareDialog = screen.getByRole('dialog', {
      name: 'Share this plan',
    });
    const backdrop = shareDialog.parentElement as HTMLElement;

    fireEvent.mouseDown(backdrop);
    expect(
      screen.getByRole('dialog', { name: 'Share this plan' }),
    ).toBeTruthy();

    fireEvent.mouseUp(backdrop);
    fireEvent.click(backdrop);

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onDetailsOpen).not.toHaveBeenCalled();
  });

  it('falls back to the feed link when owner link creation fails', async () => {
    apiMocks.createShareLink.mockRejectedValueOnce(new Error('share failed'));
    renderCard({ isOwn: true });

    fireEvent.click(screen.getByRole('button', { name: 'Event options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share Event' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Copy link',
      }),
    );

    await waitFor(() =>
      expect(clipboardWriteText).toHaveBeenCalledWith(
        `${window.location.origin}/feed?event=42`,
      ),
    );

    expect(apiMocks.createShareLink).toHaveBeenCalledWith('42');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('uses ClipboardItem when the async clipboard write API is available', async () => {
    class TestClipboardItem {
      constructor(readonly data: Record<string, Promise<Blob>>) {}
    }

    vi.stubGlobal('ClipboardItem', TestClipboardItem);
    apiMocks.createShareLink.mockResolvedValueOnce(
      'https://api.example.test/share/secret?token=ignored',
    );
    renderCard({ isOwn: true });

    fireEvent.click(screen.getByRole('button', { name: 'Event options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share Event' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Copy link',
      }),
    );

    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledTimes(1));

    const items = clipboardWrite.mock.calls[0][0] as TestClipboardItem[];
    const blob = await items[0].data['text/plain'];

    expect(items).toHaveLength(1);
    expect(blob).toBeInstanceOf(Blob);
    expect(await readBlob(blob)).toBe(`${window.location.origin}/share/secret`);
    expect(clipboardWriteText).not.toHaveBeenCalled();
  });

  it('confirms owner cancellation and blocks closing while it is pending', async () => {
    const cancellation = deferred<void>();
    const onCancel = vi.fn();

    apiMocks.archiveEvent.mockReturnValueOnce(cancellation.promise);
    renderCard({ isOwn: true, onCancel });

    fireEvent.click(screen.getByRole('button', { name: 'Event options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cancel event' }));

    let dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('Cancel this event?')).toBeTruthy();
    expect(apiMocks.archiveEvent).not.toHaveBeenCalled();

    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Event options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cancel event' }));
    dialog = screen.getByRole('dialog');

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel event' }),
    );

    expect(apiMocks.archiveEvent).toHaveBeenCalledWith('42');
    expect(
      (
        within(dialog).getByRole('button', {
          name: 'Cancel event',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(screen.getByRole('dialog')).toBeTruthy();

    await act(async () => {
      cancellation.resolve();
      await cancellation.promise;
    });

    expect(onCancel).toHaveBeenCalledWith('42');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the cancellation dialog open when archiving fails', async () => {
    const onCancel = vi.fn();

    apiMocks.archiveEvent.mockRejectedValueOnce(new Error('archive failed'));
    renderCard({ isOwn: true, onCancel });

    fireEvent.click(screen.getByRole('button', { name: 'Event options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cancel event' }));

    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', {
      name: 'Cancel event',
    });

    fireEvent.click(confirm);

    await waitFor(() =>
      expect((confirm as HTMLButtonElement).disabled).toBe(false),
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
