import { NextRequest, NextResponse } from 'next/server';

import { beApi } from '@/app/_server/api/backend';
import { validate } from '@/app/_server/api/validate';
import { planSchema, typeSchema, wishSchema } from '../schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();

    const parsedType = typeSchema.safeParse(formData.get('type'));

    if (!parsedType.success) {
      return NextResponse.json(
        { error: 'Unknown event type' },
        { status: 400 },
      );
    }

    const fields: Record<string, FormDataEntryValue> = {};

    formData.forEach((value, key) => {
      if (key !== 'type' && key !== 'cover_image') fields[key] = value;
    });

    const { error } =
      parsedType.data === 'plan'
        ? validate(planSchema, fields)
        : validate(wishSchema, fields);

    if (error) return error;

    formData.delete('type');

    const res = await beApi.event.update(
      id,
      parsedType.data,
      formData,
      cookieHeader,
    );

    return NextResponse.json(await res.json(), { status: res.status });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const parsedType = typeSchema.safeParse(body.type);

  if (!parsedType.success) {
    return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
  }

  const { data, error } =
    parsedType.data === 'plan'
      ? validate(planSchema, body)
      : validate(wishSchema, body);

  if (error) return error;

  const res = await beApi.event.update(id, parsedType.data, data, cookieHeader);

  return NextResponse.json(await res.json(), { status: res.status });
}
