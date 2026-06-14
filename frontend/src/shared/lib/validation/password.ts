import { z } from 'zod';

export const PASSWORD_HELPER_TEXT =
  'Minimum 8 characters with letters and numbers';

export const passwordSchema = z
  .string()
  .min(8, PASSWORD_HELPER_TEXT)
  .regex(/(?=.*[a-zA-Z])(?=.*[0-9])/, PASSWORD_HELPER_TEXT);
