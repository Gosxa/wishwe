import { z } from 'zod';

export const SOCIAL_MEDIA_URL_HELPER_TEXT =
  'Enter a full link, e.g. https://instagram.com/username';

export const socialMediaUrlSchema = z
  .string()
  .trim()
  .max(200, '200 characters max')
  .refine(
    value => value === '' || z.string().url().safeParse(value).success,
    SOCIAL_MEDIA_URL_HELPER_TEXT,
  );
