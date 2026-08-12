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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FriendshipStatus } from '@/shared/client_api/user/types';

const apiMocks = vi.hoisted(() => ({
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  listFriends: vi.fn(),
  listIncomingRequests: vi.fn(),
  listOutgoingRequests: vi.fn(),
  removeFriend: vi.fn(),
  sendFriendRequest: vi.fn(),
}));

vi.mock('@/shared/client_api/user', () => ({
  acceptRequest: apiMocks.acceptRequest,
  declineRequest: apiMocks.declineRequest,
  listFriends: apiMocks.listFriends,
  listIncomingRequests: apiMocks.listIncomingRequests,
  listOutgoingRequests: apiMocks.listOutgoingRequests,
  removeFriend: apiMocks.removeFriend,
  sendFriendRequest: apiMocks.sendFriendRequest,
}));

vi.mock('@/features', () => ({
  useBodyScrollLock: vi.fn(),
}));

import { UserProfileFriendButton } from './UserProfileFriendButton';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

const renderButton = (status: FriendshipStatus, onStatusChange = vi.fn()) => {
  render(
    <UserProfileFriendButton
      userId={42}
      username="alice"
      status={status}
      onStatusChange={onStatusChange}
    />,
  );

  return onStatusChange;
};

describe('UserProfileFriendButton', () => {
  beforeEach(() => {
    apiMocks.acceptRequest.mockReset();
    apiMocks.declineRequest.mockReset();
    apiMocks.listFriends.mockReset();
    apiMocks.listIncomingRequests.mockReset();
    apiMocks.listOutgoingRequests.mockReset();
    apiMocks.removeFriend.mockReset();
    apiMocks.sendFriendRequest.mockReset();

    apiMocks.acceptRequest.mockResolvedValue(undefined);
    apiMocks.declineRequest.mockResolvedValue(undefined);
    apiMocks.listFriends.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    apiMocks.listIncomingRequests.mockResolvedValue([]);
    apiMocks.listOutgoingRequests.mockResolvedValue([]);
    apiMocks.removeFriend.mockResolvedValue(undefined);
    apiMocks.sendFriendRequest.mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it.each([
    ['none', 'button', /add friend/i],
    ['requested', 'button', /requested/i],
    ['friends', 'button', /you are friends/i],
    ['self', 'link', /edit profile/i],
  ] as const)('renders the %s state', (status, role, name) => {
    renderButton(status);

    const control = screen.getByRole(role, { name });

    if (status === 'self') {
      expect(control.getAttribute('href')).toBe('/edit-profile');
    }
  });

  it('renders both actions for an incoming request', () => {
    renderButton('incoming_request');

    expect(screen.getByRole('button', { name: 'Accept' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeTruthy();
  });

  it('sends one add request while pending and changes to requested', async () => {
    const request = deferred<void>();
    const onStatusChange = vi.fn();

    apiMocks.sendFriendRequest.mockReturnValueOnce(request.promise);
    renderButton('none', onStatusChange);

    const button = screen.getByRole('button', { name: 'Add friend' });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(apiMocks.sendFriendRequest.mock.calls).toEqual([[42]]);
    expect((button as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      request.resolve();
      await request.promise;
    });

    expect(onStatusChange).toHaveBeenCalledWith('requested');
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('keeps the current state when adding a friend fails', async () => {
    const onStatusChange = vi.fn();

    apiMocks.sendFriendRequest.mockRejectedValueOnce(new Error('failed'));
    renderButton('none', onStatusChange);

    const button = screen.getByRole('button', { name: 'Add friend' });

    fireEvent.click(button);

    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false),
    );

    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('resolves and accepts the matching incoming request', async () => {
    const onStatusChange = vi.fn();

    apiMocks.listIncomingRequests.mockResolvedValueOnce([
      {
        id: 7,
        sender: 'someone-else',
        sender_avatar: null,
        receiver: 'current-user',
        status: 'pending',
      },
      {
        id: 8,
        sender: 'alice',
        sender_avatar: null,
        receiver: 'current-user',
        status: 'pending',
      },
    ]);
    renderButton('incoming_request', onStatusChange);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('friends'));

    expect(apiMocks.acceptRequest).toHaveBeenCalledWith(8);
    expect(apiMocks.declineRequest).not.toHaveBeenCalled();
  });

  it('resolves and declines the matching incoming request', async () => {
    const onStatusChange = vi.fn();

    apiMocks.listIncomingRequests.mockResolvedValueOnce([
      {
        id: 8,
        sender: 'alice',
        sender_avatar: null,
        receiver: 'current-user',
        status: 'pending',
      },
    ]);
    renderButton('incoming_request', onStatusChange);

    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('none'));

    expect(apiMocks.declineRequest).toHaveBeenCalledWith(8);
    expect(apiMocks.acceptRequest).not.toHaveBeenCalled();
  });

  it('cancels the matching outgoing request', async () => {
    const onStatusChange = vi.fn();

    apiMocks.listOutgoingRequests.mockResolvedValueOnce([
      {
        id: 9,
        sender: 'current-user',
        sender_avatar: null,
        receiver: 'alice',
        status: 'pending',
      },
    ]);
    renderButton('requested', onStatusChange);

    fireEvent.click(screen.getByRole('button', { name: /requested/i }));

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('none'));

    expect(apiMocks.removeFriend).toHaveBeenCalledWith(9);
  });

  it('confirms removal with the friendship id and closes the dialog', async () => {
    const onStatusChange = vi.fn();

    apiMocks.listFriends.mockResolvedValueOnce({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          username: 'someone-else',
          avatar: null,
          friendship_id: 10,
        },
        {
          id: 42,
          username: 'alice',
          avatar: null,
          friendship_id: 11,
        },
      ],
    });
    renderButton('friends', onStatusChange);

    fireEvent.click(screen.getByRole('button', { name: /you are friends/i }));

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('Unfriend @alice?')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Unfriend' }));

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('none'));

    expect(apiMocks.listFriends).toHaveBeenCalledWith(1, 1000);
    expect(apiMocks.removeFriend).toHaveBeenCalledWith(11);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
