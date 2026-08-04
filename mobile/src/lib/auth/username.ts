import { z } from 'zod';


export const USERNAME_HELPER_TEXT = '3-30 characters. Letters, numbers, "." and "_" only.';

export const usernameSchema = z
  .string()
  .min(3, '3 characters min')
  .max(30, '30 characters max')
  .regex(/^[a-zA-Z0-9]/, 'Cannot start with underscore or dot')
  .regex(/^[a-zA-Z0-9._]+$/, USERNAME_HELPER_TEXT)
  .regex(/^[^A-Z]*$/, 'Nickname must be lowercase');

export function validateUsername(value: string): string | undefined {
  const result = usernameSchema.safeParse(value);

  return result.success ? undefined : result.error.issues[0]?.message;
}
