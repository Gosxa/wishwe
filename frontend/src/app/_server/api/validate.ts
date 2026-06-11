import { NextResponse } from 'next/server';
import { z } from 'zod';

export const validate = <T>(
  schema: z.ZodType<T>,
  data: unknown,
): { data: T; error: null } | { data: null; error: NextResponse } => {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }

  return { data: result.data, error: null };
};
