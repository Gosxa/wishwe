import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyResponse, jsonResponse } from '@/shared/client_api/mockResponse';
import { useUserStore } from '@/shared/store/useUserStore';
import {
  archiveEvent,
  ConvertEventError,
  convertToPlan,
  createEvent,
  CreateEventError,
  createShareLink,
  expressInterest,
  getEvent,
  GetEventError,
  joinPlan,
  leaveEvent,
  listCategories,
  listEvents,
  listParticipants,
  updateEvent,
  UpdateEventError,
} from './index';
import type { BackendEvent } from './types';

const event = { id: 'evt-1', title: 'Tea tasting' } as unknown as BackendEvent;

describe('event client API', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { location: { href: '/feed' } });
    useUserStore.setState({ user: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['joinPlan', joinPlan, 'join_plan'],
    ['expressInterest', expressInterest, 'interested_in_wish'],
    ['leaveEvent', leaveEvent, 'leave_event'],
  ] as const)(
    '$0 posts the action and returns the updated event',
    async (_, call, action) => {
      fetchMock.mockResolvedValueOnce(jsonResponse(event));

      await expect(call('evt-1')).resolves.toEqual(event);
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/event/events/evt-1/${action}/`,
        { method: 'POST' },
      );
    },
  );

  it('throws an action-specific error when an event action fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 409));

    await expect(joinPlan('evt-1')).rejects.toThrow('Failed to join_plan');
  });

  it('lists events with defaults and with encoded filters', async () => {
    const page = { count: 1, next: null, previous: null, results: [event] };

    fetchMock
      .mockResolvedValueOnce(jsonResponse(page))
      .mockResolvedValueOnce(jsonResponse(page));

    await expect(listEvents()).resolves.toEqual(page);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/event/events?page=1&page_size=5',
      { method: 'GET' },
    );

    await listEvents({
      type: 'wish',
      visible: 'friends-only',
      sort: 'date asc',
      title: 'tea & cake/?',
      page: 3,
      pageSize: 17,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/event/events?page=3&page_size=17&type=wish&visible=friends-only&sort=date+asc&title=tea+%26+cake%2F%3F',
      { method: 'GET' },
    );
  });

  it('archives an event without parsing an empty success body', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse());

    await expect(archiveEvent('evt-1')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/event/events/evt-1/archive_plan/',
      { method: 'POST' },
    );
  });

  it('gets an event and preserves the status in GetEventError', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(event))
      .mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(getEvent('evt-1')).resolves.toEqual(event);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/event/events/evt-1', {
      method: 'GET',
    });

    const failure = getEvent('missing');

    await expect(failure).rejects.toBeInstanceOf(GetEventError);
    await expect(failure).rejects.toMatchObject({ status: 404 });
  });

  it('lists participants and categories', async () => {
    const participants = [{ id: 3, username: 'sam' }];
    const categories = [{ id: 9, name: 'Food' }];

    fetchMock
      .mockResolvedValueOnce(jsonResponse(participants))
      .mockResolvedValueOnce(jsonResponse(categories));

    await expect(listParticipants('evt-1')).resolves.toEqual(participants);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/event/events/evt-1/participants/',
      { method: 'GET' },
    );

    await expect(listCategories()).resolves.toEqual(categories);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/event/category', {
      method: 'GET',
    });
  });

  it('creates a share link and returns only its URL', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ share_url: 'https://wishwe.example/s/abc' }),
    );

    await expect(createShareLink('evt-1')).resolves.toBe(
      'https://wishwe.example/s/abc',
    );
    expect(fetchMock).toHaveBeenCalledWith('/next_api/event/evt-1/share', {
      method: 'POST',
    });
  });

  it('creates JSON and multipart events with the selected type', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(event))
      .mockResolvedValueOnce(jsonResponse(event));

    await expect(
      createEvent('wish', { title: 'Tea tasting', category: 9 }),
    ).resolves.toEqual(event);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/next_api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Tea tasting',
        category: 9,
        type: 'wish',
      }),
    });

    const formData = new FormData();

    formData.set('title', 'Tea tasting');
    await createEvent('plan', formData);

    expect(formData.get('type')).toBe('plan');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/next_api/event', {
      method: 'POST',
      body: formData,
    });
  });

  it('updates JSON and multipart events with PATCH', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(event))
      .mockResolvedValueOnce(jsonResponse(event));

    await updateEvent('evt-1', 'plan', { title: 'Updated' });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/next_api/event/evt-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated', type: 'plan' }),
    });

    const formData = new FormData();

    formData.set('title', 'Updated again');
    await updateEvent('evt-1', 'wish', formData);

    expect(formData.get('type')).toBe('wish');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/next_api/event/evt-1', {
      method: 'PATCH',
      body: formData,
    });
  });

  it('converts a wish to a plan with the exact payload', async () => {
    const payload = {
      event_date: '2099-08-12',
      event_time: '18:30',
      min_participants: 2,
      max_participants: 6,
    };

    fetchMock.mockResolvedValueOnce(jsonResponse(event));

    await expect(convertToPlan('evt-1', payload)).resolves.toEqual(event);
    expect(fetchMock).toHaveBeenCalledWith('/next_api/event/evt-1/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it.each([
    {
      name: 'create',
      errorType: CreateEventError,
      call: () => createEvent('wish', { title: 'Tea' }),
    },
    {
      name: 'update',
      errorType: UpdateEventError,
      call: () => updateEvent('evt-1', 'wish', { title: 'Tea' }),
    },
    {
      name: 'convert',
      errorType: ConvertEventError,
      call: () =>
        convertToPlan('evt-1', {
          event_date: '2099-08-12',
          event_time: '18:30',
          min_participants: 2,
          max_participants: 6,
        }),
    },
  ])(
    'preserves structured $name errors in its custom class',
    async ({ call, errorType }) => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ error: { title: ['Already exists'] } }, 400),
      );

      const failure = call();

      await expect(failure).rejects.toBeInstanceOf(errorType);
      await expect(failure).rejects.toMatchObject({
        body: { error: { title: ['Already exists'] } },
      });
    },
  );

  it.each([
    {
      name: 'create',
      errorType: CreateEventError,
      call: () => createEvent('wish', { title: 'Tea' }),
    },
    {
      name: 'update',
      errorType: UpdateEventError,
      call: () => updateEvent('evt-1', 'wish', { title: 'Tea' }),
    },
    {
      name: 'convert',
      errorType: ConvertEventError,
      call: () =>
        convertToPlan('evt-1', {
          event_date: '2099-08-12',
          event_time: '18:30',
          min_participants: 2,
          max_participants: 6,
        }),
    },
  ])(
    'uses an empty body for malformed $name errors',
    async ({ call, errorType }) => {
      fetchMock.mockResolvedValueOnce(
        new Response('not-json', {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const failure = call();

      await expect(failure).rejects.toBeInstanceOf(errorType);
      await expect(failure).rejects.toMatchObject({ body: {} });
    },
  );

  it.each([
    ['events', () => listEvents(), 'Failed to load events'],
    ['archive', () => archiveEvent('evt-1'), 'Failed to archive event'],
    [
      'participants',
      () => listParticipants('evt-1'),
      'Failed to load participants',
    ],
    ['categories', () => listCategories(), 'Failed to load categories'],
    [
      'share link',
      () => createShareLink('evt-1'),
      'Failed to create a share link',
    ],
  ] as const)(
    'throws the documented generic error for failed %s requests',
    async (_, call, message) => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));

      await expect(call()).rejects.toThrow(message);
    },
  );

  it('clears the user and redirects on 401 before throwing a wrapper error', async () => {
    useUserStore.setState({ user: {} as never });
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));

    await expect(listCategories()).rejects.toThrow('Unauthorized');
    expect(useUserStore.getState().user).toBeNull();
    expect(window.location.href).toBe('/onboard');
  });
});
