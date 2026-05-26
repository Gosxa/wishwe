import z from 'zod';

const nicknameSchema = z
  .string()
  .min(3, 'Minimum 3 characters')
  .max(30, 'Maximum 30 characters')
  .regex(/^[a-zA-Z0-9._]+$/, 'Letters, numbers, "." and "_" only');

const emailSchema = z.email('Enter a valid email address');

export { nicknameSchema, emailSchema };
