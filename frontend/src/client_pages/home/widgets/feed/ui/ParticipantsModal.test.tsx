// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@/shared/client_api/auth/types';
import type { ParticipantAvatar } from '@client_pages/home/model/types';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_BACKEND_URL = 'https://media.wishwe.test/api';
});

const MEDIA_ORIGIN = 'https://media.wishwe.test';

const apiMocks = vi.hoisted(() => ({
  listParticipants: vi.fn(),
}));

vi.mock('@/shared/client_api/event', () => ({
  listParticipants: apiMocks.listParticipants,
}));

import { useUserStore } from '@/shared/store/useUserStore';
import { ParticipantsModal } from './ParticipantsModal';

type BackendParticipant = { username: string | null; avatar: string | null };

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

type HarnessProps = {
  isOpen?: boolean;
  eventId?: string;
  initialParticipants?: ParticipantAvatar[];
  onClose?: () => void;
};

const Harness = ({
  isOpen = true,
  eventId = '42',
  initialParticipants = [],
  onClose = vi.fn(),
}: HarnessProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button">
        Who is going
      </button>
      {isOpen && (
        <ParticipantsModal
          eventId={eventId}
          initialParticipants={initialParticipants}
          returnFocusRef={triggerRef}
          onClose={onClose}
        />
      )}
    </>
  );
};

const renderModal = (props: HarnessProps = {}) =>
  render(<Harness {...props} />);

const trigger = () => screen.getByRole('button', { name: 'Who is going' });

const closeButton = () => screen.getByRole('button', { name: 'Close' });

describe('ParticipantsModal', () => {
  beforeEach(() => {
    apiMocks.listParticipants.mockReset();
    apiMocks.listParticipants.mockResolvedValue([] as BackendParticipant[]);
    useUserStore.setState({ user: null });
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('left');
    document.body.style.removeProperty('right');
    document.body.style.removeProperty('padding-right');
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a loading status until the participants request settles', async () => {
    const pending = deferred<BackendParticipant[]>();

    apiMocks.listParticipants.mockReturnValue(pending.promise);

    renderModal({
      initialParticipants: [{ username: '@stale', avatar: null }],
    });

    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();

    await act(async () => {
      pending.resolve([{ username: 'amy', avatar: null }]);
    });

    expect(screen.queryByText('Loading...')).toBeNull();
    expect(screen.getByText('@amy')).toBeTruthy();
  });

  it('requests the participants for the given event and renders the fresh list', async () => {
    apiMocks.listParticipants.mockResolvedValue([
      { username: 'amy', avatar: '/media/amy.png' },
      { username: null, avatar: null },
    ]);

    renderModal({ eventId: '7' });

    await waitFor(() =>
      expect(screen.getByRole('list').children).toHaveLength(2),
    );

    expect(apiMocks.listParticipants).toHaveBeenCalledWith('7');

    const avatar = screen.getByAltText('@amy') as HTMLImageElement;

    expect(avatar.getAttribute('src')).toBe(`${MEDIA_ORIGIN}/media/amy.png`);
    expect(avatar.getAttribute('loading')).toBe('lazy');
    expect(screen.getByText('@someone')).toBeTruthy();
    expect(screen.queryByAltText('@someone')).toBeNull();
  });

  it('links each named participant to their profile', async () => {
    apiMocks.listParticipants.mockResolvedValue([
      { username: 'amy', avatar: null },
    ]);

    renderModal();

    const link = await screen.findByRole('link', { name: '@amy' });

    expect(link.getAttribute('href')).toBe('/user/amy');
  });

  it('links the signed-in user to their own profile page', async () => {
    useUserStore.setState({
      user: { username: 'amy' } as Profile,
    });
    apiMocks.listParticipants.mockResolvedValue([
      { username: 'amy', avatar: null },
    ]);

    renderModal();

    const link = await screen.findByRole('link', { name: '@amy' });

    expect(link.getAttribute('href')).toBe('/profile');
  });

  it('shows an empty state when nobody has joined', async () => {
    apiMocks.listParticipants.mockResolvedValue([]);

    renderModal();

    expect(await screen.findByText('No one has joined yet.')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('shows an error instead of a stale list when the request fails', async () => {
    apiMocks.listParticipants.mockRejectedValue(new Error('offline'));

    renderModal({
      initialParticipants: [{ username: '@stale', avatar: null }],
    });

    expect(
      await screen.findByText(
        'Could not load participants. Please try again later.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('@stale')).toBeNull();
    expect(screen.queryByText('No one has joined yet.')).toBeNull();
  });

  it('is exposed as a labelled modal dialog', async () => {
    renderModal();

    const dialog = screen.getByRole('dialog');

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(
      document.getElementById(dialog.getAttribute('aria-labelledby') as string)
        ?.textContent,
    ).toBe("Who's going");

    await screen.findByText('No one has joined yet.');
  });

  it('moves focus to the close button and returns it to the trigger on close', async () => {
    const { rerender } = renderModal();

    await waitFor(() => expect(document.activeElement).toBe(closeButton()));

    rerender(<Harness isOpen={false} />);

    expect(document.activeElement).toBe(trigger());
  });

  it('closes only through the close button, not through an overlay click', async () => {
    const onClose = vi.fn();

    renderModal({ onClose });

    await screen.findByText('No one has joined yet.');

    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;

    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(closeButton());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scrolling while open and restores it on close', async () => {
    const { rerender } = renderModal();

    await screen.findByText('No one has joined yet.');
    expect(document.body.style.position).toBe('fixed');

    rerender(<Harness isOpen={false} />);
    expect(document.body.style.position).toBe('');
  });

  it('ignores a response that arrives after the modal is unmounted', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const pending = deferred<BackendParticipant[]>();

    apiMocks.listParticipants.mockReturnValue(pending.promise);

    const { rerender } = renderModal();

    rerender(<Harness isOpen={false} />);

    await act(async () => {
      pending.resolve([{ username: 'late', avatar: null }]);
    });

    expect(screen.queryByText('@late')).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('reloads when the event id changes', async () => {
    const { rerender } = renderModal({ eventId: '1' });

    await waitFor(() =>
      expect(apiMocks.listParticipants).toHaveBeenCalledWith('1'),
    );

    rerender(<Harness eventId="2" />);

    await waitFor(() =>
      expect(apiMocks.listParticipants).toHaveBeenCalledWith('2'),
    );
    expect(apiMocks.listParticipants).toHaveBeenCalledTimes(2);
  });
});
