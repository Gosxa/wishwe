import { ChangeEvent, useState } from 'react';
import { FieldConfig, FieldErrors, FieldSuccess, Fields } from './types';
import z from 'zod';
import { profileFormConfig } from '../lib';
import { useOnboardDataStore } from '../../../model';
import { useOnboardContext } from '@/client_pages/onboard/model';

const validateField = (schema: z.ZodTypeAny, value: string): string | null => {
  const result = schema.safeParse(value);

  return result.success ? null : result.error.issues[0].message;
};

export const useProfileForm = () => {
  const values = useOnboardDataStore(s => s.values);
  const setField = useOnboardDataStore(s => s.setField);
  const setAvatarUrl = useOnboardDataStore(s => s.setAvatarUrl);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<FieldSuccess>({});
  const { goTo } = useOnboardContext();

  const handleChange =
    (field: keyof Fields) => (e: ChangeEvent<HTMLInputElement>) => {
      setField(field, e.target.value);
    };

  const handleBlur = (config: FieldConfig) => () => {
    const { field, schema } = config;

    if (!schema) {
      setSuccess(prev => ({ ...prev, [field]: values[field].length > 0 }));

      return;
    }

    const error = validateField(schema, values[field]);

    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
      setSuccess(prev => ({ ...prev, [field]: false }));
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }));
      setSuccess(prev => ({ ...prev, [field]: true }));
    }
  };

  const handleSubmit = () => {
    const newErrors: FieldErrors = {};

    for (const { field, schema } of profileFormConfig) {
      if (!schema) continue;

      const error = validateField(schema, values[field]);

      if (error) newErrors[field] = error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccess(prev => ({
        ...prev,
        ...Object.fromEntries(Object.keys(newErrors).map(f => [f, false])),
      }));

      return;
    }

    goTo(2);
  };

  const isSubmitDisabled = profileFormConfig
    .filter(c => c.required)
    .some(c => !success[c.field]);

  const handle = {
    change: handleChange,
    blur: handleBlur,
    submit: handleSubmit,
  };

  return { values, handle, setAvatarUrl, errors, success, isSubmitDisabled };
};
