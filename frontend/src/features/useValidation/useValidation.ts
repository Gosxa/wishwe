import { useState } from 'react';
import z from 'zod';

const validate = <S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): z.infer<S> => {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  return result.data;
};

const useValidation = <S extends z.ZodTypeAny>(schema: S) => {
  const [error, setError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);

  const check = (arg: unknown): boolean => {
    try {
      validate(schema, arg);
      setError(undefined);
      setIsSuccess(true);

      return true;
    } catch (e) {
      setError((e as Error).message);
      setIsSuccess(false);

      return false;
    }
  };

  return {
    error,
    isSuccess,
    check,
    set: { error: setError, success: setIsSuccess },
  };
};

export { useValidation, validate };
