import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backendMocks } from './route-handler-backend-mocks';

import {
  context,
  COOKIE,
  createEvent,
  emptyResponse,
  jsonRequest,
  jsonResponse,
  malformedJsonRequest,
  request,
  updateEvent,
} from './route-handler-test-kit';

vi.mock('@/app/_server/api/backend', async () => {
  const { backendMocks: mocks } = await import('./route-handler-backend-mocks');

  return { beApi: mocks };
});

describe('event create and update route handlers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const planBody = {
    type: 'plan',
    category: '3',
    title: 'Picnic in the park',
    description: 'Bring something small',
    location: 'Central Park',
    min_participants: '2',
    max_participants: '8',
    event_date: '2027-06-12',
    event_time: '14:30',
    event_visibility: 'friends-only',
    external_link: '',
    ignored: 'strip me',
  };
  const forwardedPlan = {
    category: 3,
    title: 'Picnic in the park',
    description: 'Bring something small',
    location: 'Central Park',
    min_participants: 2,
    max_participants: 8,
    event_date: '2027-06-12',
    event_time: '14:30',
    event_visibility: 'friends-only',
    external_link: '',
  };
  const wishBody = {
    type: 'wish',
    title: 'See the northern lights',
    location: 'Iceland',
    min_participants: 1,
    timeframe_text: 'Next winter',
  };
  const forwardedWish = {
    title: 'See the northern lights',
    location: 'Iceland',
    min_participants: 1,
    timeframe_text: 'Next winter',
  };

  const jsonEventCases = [
    {
      name: 'creates a plan',
      mock: backendMocks.event.create,
      body: planBody,
      invoke: (req: NextRequest) => createEvent(req),
      expectedArgs: ['plan', forwardedPlan, COOKIE],
    },
    {
      name: 'creates a wish',
      mock: backendMocks.event.create,
      body: wishBody,
      invoke: (req: NextRequest) => createEvent(req),
      expectedArgs: ['wish', forwardedWish, COOKIE],
    },
    {
      name: 'updates a plan',
      mock: backendMocks.event.update,
      body: planBody,
      invoke: (req: NextRequest) => updateEvent(req, context({ id: 'evt-7' })),
      expectedArgs: ['evt-7', 'plan', forwardedPlan, COOKIE],
    },
    {
      name: 'updates a wish',
      mock: backendMocks.event.update,
      body: wishBody,
      invoke: (req: NextRequest) => updateEvent(req, context({ id: 'evt-7' })),
      expectedArgs: ['evt-7', 'wish', forwardedWish, COOKIE],
    },
  ];

  it.each(jsonEventCases)(
    '$name from JSON, coerces fields, and strips transport-only fields',
    async ({ mock, body, invoke, expectedArgs }) => {
      const backendBody = { detail: 'Event conflict', code: 'conflict' };

      mock.mockResolvedValueOnce(jsonResponse(backendBody, 409));

      const response = await invoke(
        jsonRequest('/next_api/event/evt-7', body, 'POST', COOKIE),
      );

      expect(mock).toHaveBeenCalledWith(...expectedArgs);
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual(backendBody);
    },
  );

  it.each([
    {
      name: 'create',
      invoke: (req: NextRequest) => createEvent(req),
      mocks: [backendMocks.event.create],
    },
    {
      name: 'update',
      invoke: (req: NextRequest) => updateEvent(req, context({ id: 'evt-8' })),
      mocks: [backendMocks.event.update],
    },
  ])(
    'rejects an unknown JSON event type during $name',
    async ({ invoke, mocks }) => {
      const response = await invoke(
        jsonRequest(
          '/next_api/event/evt-8',
          { ...wishBody, type: 'surprise' },
          'POST',
          COOKIE,
        ),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'Unknown event type',
      });
      mocks.forEach(mock => expect(mock).not.toHaveBeenCalled());
    },
  );

  it.each([
    ['plan', { ...planBody, title: '', max_participants: 1 }, 'title'],
    ['wish', { ...wishBody, location: '', timeframe_text: '' }, 'location'],
  ])(
    'rejects invalid %s fields before calling Django',
    async (_type, body, field) => {
      const response = await createEvent(
        jsonRequest('/next_api/event', body, 'POST', COOKIE),
      );
      const responseBody = (await response.json()) as {
        error: Record<string, string[]>;
      };

      expect(response.status).toBe(400);
      expect(responseBody.error).toHaveProperty(field);
      expect(backendMocks.event.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      'create',
      (req: NextRequest) => createEvent(req),
      backendMocks.event.create,
    ],
    [
      'update',
      (req: NextRequest) => updateEvent(req, context({ id: 'evt-9' })),
      backendMocks.event.update,
    ],
  ])('rejects malformed JSON during event %s', async (_name, invoke, mock) => {
    await expect(
      invoke(malformedJsonRequest('/next_api/event/evt-9')),
    ).rejects.toBeInstanceOf(SyntaxError);
    expect(mock).not.toHaveBeenCalled();
  });

  const makeEventForm = (type: 'plan' | 'wish') => {
    const data = new FormData();

    data.set('type', type);
    data.set('title', type === 'plan' ? 'Multipart plan' : 'Multipart wish');
    data.set('location', 'Kyiv');
    data.set('min_participants', '2');
    data.set(
      'cover_image',
      new File(['image bytes'], 'cover.png', { type: 'image/png' }),
    );

    if (type === 'plan') {
      data.set('event_date', '2027-07-01');
      data.set('event_time', '17:00');
      data.set('max_participants', '6');
    } else {
      data.set('timeframe_text', 'This summer');
    }

    return data;
  };

  it.each([
    {
      name: 'creates a multipart plan',
      type: 'plan' as const,
      mock: backendMocks.event.create,
      invoke: (req: NextRequest) => createEvent(req),
      expectedPrefix: ['plan'],
    },
    {
      name: 'creates a multipart wish',
      type: 'wish' as const,
      mock: backendMocks.event.create,
      invoke: (req: NextRequest) => createEvent(req),
      expectedPrefix: ['wish'],
    },
    {
      name: 'updates a multipart plan',
      type: 'plan' as const,
      mock: backendMocks.event.update,
      invoke: (req: NextRequest) => updateEvent(req, context({ id: 'evt-10' })),
      expectedPrefix: ['evt-10', 'plan'],
    },
    {
      name: 'updates a multipart wish',
      type: 'wish' as const,
      mock: backendMocks.event.update,
      invoke: (req: NextRequest) => updateEvent(req, context({ id: 'evt-10' })),
      expectedPrefix: ['evt-10', 'wish'],
    },
  ])(
    '$name and retains the file payload',
    async ({ type, mock, invoke, expectedPrefix }) => {
      mock.mockResolvedValueOnce(jsonResponse({ id: 'evt-10' }, 201));

      const response = await invoke(
        request('/next_api/event/evt-10', {
          method: type === 'plan' ? 'POST' : 'PATCH',
          headers: { cookie: COOKIE },
          body: makeEventForm(type),
        }),
      );
      const forwardedData = mock.mock.calls[0][
        expectedPrefix.length
      ] as FormData;

      expect(mock).toHaveBeenCalledOnce();
      expect(mock.mock.calls[0].slice(0, expectedPrefix.length)).toEqual(
        expectedPrefix,
      );
      expect(forwardedData).toBeInstanceOf(FormData);
      expect(forwardedData.has('type')).toBe(false);
      expect(forwardedData.get('title')).toBe(
        type === 'plan' ? 'Multipart plan' : 'Multipart wish',
      );
      expect(forwardedData.get('cover_image')).toBeInstanceOf(File);
      expect(mock.mock.calls[0].at(-1)).toBe(COOKIE);
      expect(response.status).toBe(201);
    },
  );

  it.each([
    {
      name: 'create',
      mock: backendMocks.event.create,
      invoke: (req: NextRequest) => createEvent(req),
    },
    {
      name: 'update',
      mock: backendMocks.event.update,
      invoke: (req: NextRequest) => updateEvent(req, context({ id: 'evt-11' })),
    },
  ])(
    'rejects unknown multipart types during $name',
    async ({ mock, invoke }) => {
      const data = makeEventForm('wish');

      data.set('type', 'unknown');

      const response = await invoke(
        request('/next_api/event/evt-11', {
          method: 'POST',
          headers: { cookie: COOKIE },
          body: data,
        }),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'Unknown event type',
      });
      expect(mock).not.toHaveBeenCalled();
    },
  );

  it('validates multipart fields while ignoring the cover image', async () => {
    const data = makeEventForm('plan');

    data.set('title', '');

    const response = await createEvent(
      request('/next_api/event', {
        method: 'POST',
        headers: { cookie: COOKIE },
        body: data,
      }),
    );
    const body = (await response.json()) as {
      error: Record<string, string[]>;
    };

    expect(response.status).toBe(400);
    expect(body.error).toHaveProperty('title');
    expect(backendMocks.event.create).not.toHaveBeenCalled();
  });

  it('rejects a malformed multipart request before calling Django', async () => {
    const malformed = request('/next_api/event', {
      method: 'POST',
      headers: {
        cookie: COOKIE,
        'content-type': 'multipart/form-data; boundary=missing',
      },
      body: 'this body has no multipart boundary markers',
    });

    await expect(createEvent(malformed)).rejects.toThrow();
    expect(backendMocks.event.create).not.toHaveBeenCalled();
  });

  it('propagates an unexpected event backend failure', async () => {
    const failure = new TypeError('event service unavailable');

    backendMocks.event.create.mockRejectedValueOnce(failure);

    await expect(
      createEvent(jsonRequest('/next_api/event', wishBody, 'POST', COOKIE)),
    ).rejects.toBe(failure);
  });

  it('does not synthesize JSON for an unexpected empty create response', async () => {
    backendMocks.event.create.mockResolvedValueOnce(emptyResponse());

    await expect(
      createEvent(jsonRequest('/next_api/event', wishBody, 'POST', COOKIE)),
    ).rejects.toBeInstanceOf(SyntaxError);
  });
});
