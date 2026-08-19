const DEFAULT_SUBMIT_ERROR = 'Something went wrong. Please try again.';

export const firstApiFieldError = (value: unknown): string | undefined =>
  typeof value === 'string'
    ? value
    : Array.isArray(value) && value.length > 0
      ? String(value[0])
      : undefined;

export const unwrapApiErrorBody = (
  body: Record<string, unknown>,
): Record<string, unknown> =>
  typeof body.error === 'object' &&
  body.error !== null &&
  !Array.isArray(body.error)
    ? (body.error as Record<string, unknown>)
    : body;

export const mapApiFormErrors = <Field extends string>(
  rawBody: Record<string, unknown>,
  fieldMap: Readonly<Record<string, Field>>,
): Partial<Record<Field | 'submit', string>> => {
  const body = unwrapApiErrorBody(rawBody);
  const errors: Partial<Record<Field | 'submit', string>> = {};

  Object.entries(fieldMap).forEach(([apiField, formField]) => {
    const message = firstApiFieldError(body[apiField]);

    if (message) errors[formField] = message;
  });

  errors.submit =
    firstApiFieldError(body.non_field_errors) ??
    (typeof body.detail === 'string' ? body.detail : undefined) ??
    (Object.values(errors).some(Boolean) ? undefined : DEFAULT_SUBMIT_ERROR);

  return errors;
};
