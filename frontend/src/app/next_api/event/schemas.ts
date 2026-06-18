import { z } from 'zod';

export const typeSchema = z.enum(['plan', 'wish']);

const baseSchema = {
  category: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  location: z.string().min(1).max(255),
  min_participants: z.coerce.number().int().min(1),
  event_visibility: z.enum(['friends-only', 'f-o-f']).optional(),
};

export const planSchema = z.object({
  ...baseSchema,
  event_date: z.string().min(1),
  event_time: z.string().min(1),
  max_participants: z.coerce.number().int().min(2),
  external_link: z.union([z.url().max(200), z.literal('')]).optional(),
});

export const wishSchema = z.object({
  ...baseSchema,
  timeframe_text: z.string().min(1),
});
