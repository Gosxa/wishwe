import { z } from 'zod';


export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => !/^\d+$/.test(value), 'Password cannot be only digits');

export function validatePassword(value: string): string | undefined {
  const result = passwordSchema.safeParse(value);

  return result.success ? undefined : result.error.issues[0]?.message;
}
