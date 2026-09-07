import { NextRequest, NextResponse } from 'next/server';

import { validate } from '@/app/_server/api/validate';
import { planSchema, typeSchema, wishSchema } from './schemas';

type EventType = 'plan' | 'wish';

type EventWriteRequest = {
  type: EventType;
  payload: FormData | Record<string, unknown>;
};

type ParseResult =
  | { data: EventWriteRequest; error: null }
  | { data: null; error: NextResponse };

const unknownEventType = () =>
  NextResponse.json({ error: 'Unknown event type' }, { status: 400 });

const validateEventFields = (type: EventType, fields: unknown) =>
  type === 'plan' ? validate(planSchema, fields) : validate(wishSchema, fields);

export const parseEventWriteRequest = async (
  request: NextRequest,
): Promise<ParseResult> => {
  const isMultipart = (request.headers.get('content-type') ?? '').includes(
    'multipart/form-data',
  );
  let multipartPayload: FormData | null = null;
  let fields: unknown;
  let rawType: unknown;

  if (isMultipart) {
    multipartPayload = await request.formData();
    rawType = multipartPayload.get('type');

    const scalarFields: Record<string, FormDataEntryValue> = {};

    multipartPayload.forEach((value, key) => {
      if (key !== 'type' && key !== 'cover_image') {
        scalarFields[key] = value;
      }
    });
    fields = scalarFields;
  } else {
    const jsonFields = (await request.json()) as Record<string, unknown>;

    fields = jsonFields;
    rawType = jsonFields.type;
  }

  const parsedType = typeSchema.safeParse(rawType);

  if (!parsedType.success) {
    return { data: null, error: unknownEventType() };
  }

  const validated = validateEventFields(parsedType.data, fields);

  if (validated.error) {
    return { data: null, error: validated.error };
  }

  if (multipartPayload) {
    multipartPayload.delete('type');
  }

  return {
    data: {
      type: parsedType.data,
      payload: multipartPayload ?? validated.data,
    },
    error: null,
  };
};
