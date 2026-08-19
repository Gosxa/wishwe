import { describe, expect, it } from 'vitest';
import { firstApiFieldError, unwrapApiErrorBody } from './formErrors';

describe('formErrors', () => {
  it('returns string errors and the first array item', () => {
    expect(firstApiFieldError('Invalid title')).toBe('Invalid title');
    expect(firstApiFieldError(['First error', 'Second error'])).toBe(
      'First error',
    );
  });

  it('unwraps only a non-null, non-array error object', () => {
    const nested = { error: { title: 'Invalid title' } };
    const arrayError = { error: ['Invalid title'] };
    const nullError = { error: null };

    expect(unwrapApiErrorBody(nested)).toEqual({ title: 'Invalid title' });
    expect(unwrapApiErrorBody(arrayError)).toBe(arrayError);
    expect(unwrapApiErrorBody(nullError)).toBe(nullError);
  });
});
