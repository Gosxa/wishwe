import { z } from 'zod';

export const NICKNAME_HELPER_TEXT =
  '3-30 characters. Letters, numbers, "." and "_" only.';

export const nicknameSchema = z
  .string()
  .min(3, '3 characters min')
  .max(30, '30 characters max')
  .regex(/^[a-zA-Z0-9]/, 'Cannot start with underscore or dot')
  .regex(/^[a-zA-Z0-9._]+$/, NICKNAME_HELPER_TEXT)
  .regex(/^[^A-Z]*$/, 'Nickname must be lowercase');
