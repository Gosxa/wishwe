import { expect, type APIRequestContext } from '@playwright/test';
import type { DisposableAccount } from './accounts';

export type SeededEvent = {
  id: string;
  title: string;
};

type PlanOptions = {
  title: string;
  location?: string;
  description?: string;
  inDays?: number;
  time?: string;
  minParticipants?: number;
  maxParticipants?: number;
  visibility?: 'friends-only' | 'f-o-f';
};

type WishOptions = {
  title: string;
  location?: string;
  description?: string;
  timeframe?: string;
  minParticipants?: number;
  visibility?: 'friends-only' | 'f-o-f';
};

const isoDateIn = (days: number) => {
  const date = new Date();

  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
};

export const firstCategoryId = async (api: APIRequestContext) => {
  const res = await api.get('/api/event/category');

  expect(res.status(), 'categories should be listable').toBe(200);

  const categories = (await res.json()) as { id: number; name: string }[];

  expect(
    categories.length,
    'seed_e2e must create at least one category',
  ).toBeGreaterThan(0);

  return categories[0].id;
};

export const createPlan = async (
  api: APIRequestContext,
  options: PlanOptions,
): Promise<SeededEvent> => {
  const res = await api.post('/next_api/event', {
    data: {
      type: 'plan',
      category: await firstCategoryId(api),
      title: options.title,
      description: options.description ?? 'Created by the Playwright suite.',
      location: options.location ?? 'Playwright Test Venue',
      event_date: isoDateIn(options.inDays ?? 21),
      event_time: options.time ?? '18:00',
      min_participants: options.minParticipants ?? 1,
      max_participants: options.maxParticipants ?? 8,
      event_visibility: options.visibility ?? 'f-o-f',
    },
  });

  expect(res.status(), `failed to create plan "${options.title}"`).toBe(201);

  const event = (await res.json()) as { id: number | string };

  return { id: String(event.id), title: options.title };
};

export const createWish = async (
  api: APIRequestContext,
  options: WishOptions,
): Promise<SeededEvent> => {
  const res = await api.post('/next_api/event', {
    data: {
      type: 'wish',
      category: await firstCategoryId(api),
      title: options.title,
      description: options.description ?? 'Created by the Playwright suite.',
      location: options.location ?? 'Somewhere nice',
      timeframe_text: options.timeframe ?? 'Sometime next month',
      min_participants: options.minParticipants ?? 1,
      event_visibility: options.visibility ?? 'f-o-f',
    },
  });

  expect(res.status(), `failed to create wish "${options.title}"`).toBe(201);

  const event = (await res.json()) as { id: number | string };

  return { id: String(event.id), title: options.title };
};

export const createInvite = async (api: APIRequestContext) => {
  const res = await api.post('/next_api/user/invite');

  expect(res.status(), 'failed to create an invite link').toBe(201);

  const { token } = (await res.json()) as { token: string };

  expect(token, 'the invite response should carry a token').toBeTruthy();

  return token;
};

type FriendRequest = { id: number; sender: string; receiver: string };

export const befriend = async (
  sender: DisposableAccount,
  receiver: DisposableAccount,
) => {
  const sent = await sender.api.post('/next_api/user/friendship/send', {
    data: { receiver_id: receiver.userId },
  });

  expect(
    sent.ok(),
    `friend request ${sender.username} -> ${receiver.username} failed`,
  ).toBe(true);

  const incoming = await receiver.api.get('/api/user/friendship/incoming');

  expect(incoming.status()).toBe(200);

  const requests = (await incoming.json()) as FriendRequest[];
  const match = requests.find(request => request.sender === sender.username);

  expect(match, `no incoming request from ${sender.username}`).toBeDefined();

  const accepted = await receiver.api.post(
    `/next_api/user/friendship/${match!.id}/accept`,
  );

  expect(accepted.ok(), 'accepting the friend request failed').toBe(true);

  return match!.id;
};
