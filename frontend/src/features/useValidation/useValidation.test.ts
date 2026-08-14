// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { useValidation, validate } from './useValidation';

describe('validate', () => {
  it('returns the parsed value, including schema transforms', () => {
    const schema = z
      .string()
      .trim()
      .min(3)
      .transform(value => value.toUpperCase());

    expect(validate(schema, '  amy  ')).toBe('AMY');
  });

  it('throws the first validation issue as an Error', () => {
    const schema = z
      .string()
      .min(5, 'Enter at least five characters.')
      .regex(/[A-Z]/, 'Include an uppercase letter.');

    expect(() => validate(schema, 'abc')).toThrow(
      'Enter at least five characters.',
    );
  });
});

describe('useValidation', () => {
  afterEach(cleanup);

  it('tracks failure and clears it after a successful check', () => {
    const schema = z.string().min(3, 'Too short.');
    const { result } = renderHook(() => useValidation(schema));
    let isValid = true;

    expect(result.current.error).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);

    act(() => {
      isValid = result.current.check('x');
    });

    expect(isValid).toBe(false);
    expect(result.current.error).toBe('Too short.');
    expect(result.current.isSuccess).toBe(false);

    act(() => {
      isValid = result.current.check('valid');
    });

    expect(isValid).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.isSuccess).toBe(true);
  });

  it('exposes setters for server-side validation state', () => {
    const { result } = renderHook(() => useValidation(z.string()));

    act(() => {
      result.current.set.error('This nickname is already taken.');
      result.current.set.success(false);
    });

    expect(result.current.error).toBe('This nickname is already taken.');
    expect(result.current.isSuccess).toBe(false);

    act(() => {
      result.current.set.error(undefined);
      result.current.set.success(true);
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.isSuccess).toBe(true);
  });
});
