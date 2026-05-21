'use client';

import { useState, type ChangeEvent } from 'react';
import { z } from 'zod';
import { TextInput } from '@/shared/ui/';
import { OnBoardScreen } from '../onboardScreen/OnBoardScreen';
import { AvatarCrop } from './avatarCrop/AvatarCrop';
import s from './registerGoogle.module.scss';
// TODO: add nickname uniq validation

const screenProps = {
  h1: 'Is this you?',
  heading: `We've pulled your info from Google. Make sure it looks right before joining the circle`,
};

const nicknameSchema = z
  .string()
  .min(3, 'Minimum 3 characters')
  .max(30, 'Maximum 30 characters')
  .regex(/^[a-zA-Z0-9._]+$/, 'Letters, numbers, "." and "_" only');

type Fields = {
  nickname: string;
  firstName: string;
  lastName: string;
};

type FieldConfig = {
  field: keyof Fields;
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  helperText?: string;
  schema?: z.ZodTypeAny;
};

const fieldConfigs: FieldConfig[] = [
  {
    field: 'nickname',
    id: 'nickname',
    label: 'Your nickname',
    placeholder: 'e.g. helloworlddb',
    required: true,
    helperText: '3-30 characters. Letters, numbers, "." and "_" only.',
    schema: nicknameSchema,
  },
  {
    field: 'firstName',
    id: 'firstName',
    label: 'First name',
    placeholder: 'First name',
  },
  {
    field: 'lastName',
    id: 'lastName',
    label: 'Last name',
    placeholder: 'Last name',
  },
];

type FieldErrors = Partial<Record<keyof Fields, string>>;
type FieldSuccess = Partial<Record<keyof Fields, boolean>>;

const validateField = (schema: z.ZodTypeAny, value: string): string | null => {
  const result = schema.safeParse(value);

  return result.success ? null : result.error.issues[0].message;
};

export const RegisterGoogle = () => {
  const [values, setValues] = useState<Fields>({
    nickname: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<FieldSuccess>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleChange =
    (field: keyof Fields) => (e: ChangeEvent<HTMLInputElement>) => {
      setValues(prev => ({ ...prev, [field]: e.target.value }));
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

    for (const { field, schema } of fieldConfigs) {
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

    // TODO: add send request && add image reset && api call && decompose
  };

  return (
    <OnBoardScreen {...screenProps}>
      <form className={s.regGoogle}>
        <AvatarCrop onChange={setAvatarUrl} />
        {fieldConfigs.map(config => (
          <TextInput
            key={config.id}
            id={config.id}
            label={config.label}
            placeholder={config.placeholder}
            required={config.required}
            helperText={config.helperText}
            value={values[config.field]}
            onChange={handleChange(config.field)}
            onBlur={handleBlur(config)}
            error={errors[config.field]}
            isSuccess={success[config.field]}
          />
        ))}
        <button className={s.btn} type="button" onClick={handleSubmit}>
          <span>Let&apos;s go</span>
        </button>
      </form>
    </OnBoardScreen>
  );
};
