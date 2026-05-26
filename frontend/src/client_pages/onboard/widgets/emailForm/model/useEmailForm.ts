import { ChangeEvent, useState } from 'react';
import { useOnboardDataStore, useOnboardContext } from '../../../model';
import { emailConfig } from '../lib/config';

export const useEmailForm = () => {
  const email = useOnboardDataStore(s => s.values.email);
  const setField = useOnboardDataStore(s => s.setField);
  const [error, setError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const { next, prev } = useOnboardContext();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setField('email', e.target.value);
  };

  const handleBlur = () => {
    const result = emailConfig.schema.safeParse(email);

    if (!result.success) {
      setError(result.error.issues[0].message);
      setIsSuccess(false);
    } else {
      setError(undefined);
      setIsSuccess(true);
    }
  };

  const handleSubmit = () => {
    const result = emailConfig.schema.safeParse(email);

    if (!result.success) {
      setError(result.error.issues[0].message);
      setIsSuccess(false);

      return;
    }

    next();
  };

  return {
    email,
    error,
    isSuccess,
    isSubmitDisabled: !isSuccess,
    handleChange,
    handleBlur,
    handleSubmit,
    prev,
  };
};
