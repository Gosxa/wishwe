import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { z } from 'zod';

import { AuthScreen, PrimaryButton, TextField } from '@/components/auth';
import { Spacing } from '@/constants/theme';
import { emailStart } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuthFlow } from '@/lib/auth/auth-flow';

const emailSchema = z.email('please, enter valid email');

export default function EnterEmailScreen() {
  const { email, setEmail, setVerificationToken } = useAuthFlow();
  const [error, setError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (value: string) => {
    const result = emailSchema.safeParse(value.trim());
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'please, enter valid email');
      setIsSuccess(false);
      return false;
    }
    setError(undefined);
    setIsSuccess(true);
    return true;
  };

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!validate(trimmed) || loading) return;

    setLoading(true);
    try {
      const { flow } = await emailStart(trimmed);
      setEmail(trimmed);
      setVerificationToken('');

      if (flow === 'login') {
        router.push('/enter-password');
      } else {
        router.push('/verify-register');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Service temporarily unavailable');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Enter your email"
      headline="We'll get you started or sign you back in."
      backLabel="Back"
      onBack={() => router.back()}
    >
      <TextField
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError(undefined);
          setIsSuccess(false);
        }}
        onBlur={() => {
          if (email) validate(email);
        }}
        placeholder="mail@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        error={error}
        helperText={isSuccess ? 'OK' : undefined}
        isSuccess={isSuccess}
        editable={!loading}
      />
      <PrimaryButton
        label="Continue"
        onPress={onSubmit}
        loading={loading}
        style={styles.submit}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: Spacing.two,
  },
});
