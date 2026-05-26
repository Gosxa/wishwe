import type { z } from 'zod';

interface Fields {
  email: string;
  nickname: string;
  firstName: string;
  lastName: string;
}

interface FieldConfig {
  field: keyof Fields;
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  helperText?: string;
  schema?: z.ZodTypeAny;
}

type FieldErrors = Partial<Record<keyof Fields, string>>;
type FieldSuccess = Partial<Record<keyof Fields, boolean>>;

export type { Fields, FieldConfig, FieldErrors, FieldSuccess };
