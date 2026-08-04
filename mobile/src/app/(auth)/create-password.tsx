import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { AuthScreen, PasswordField, PrimaryButton } from '@/components/auth';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useAuthFlow } from '@/lib/auth/auth-flow';
import { validatePassword } from '@/lib/auth/password';

export default function CreatePasswordScreen() {
  const { email, verificationToken } = useAuthFlow();
  const { finishRegistration } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  if (!verificationToken) {
    return (
      <AuthScreen
        title="Create a password"
        headline="Confirm your email first to continue."
        backLabel="Back"
        onBack={() => router.replace('/enter-email')}
      >
        <PrimaryButton label="Enter email" onPress={() => router.replace('/enter-email')} />
      </AuthScreen>
    );
  }

  const onSubmit = async () => {
    if (loading) return;

    const nextPasswordError = validatePassword(password);
    const nextConfirmError = password === confirm ? undefined : 'Passwords do not match';

    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);

    if (nextPasswordError || nextConfirmError) return;

    setLoading(true);
    try {
      // Creating the account signs the user in, which flips the route guard in
      // the root layout and moves them out of the auth stack.
      await finishRegistration(verificationToken, password);
    } catch (e) {
      setPasswordError(e instanceof ApiError ? e.message : 'Service temporarily unavailable');
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Create a password"
      headline={`Pick a password for ${email}. At least 8 characters, and not only numbers.`}
      backLabel="Back"
      onBack={() => router.back()}
    >
      <PasswordField
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError(undefined);
        }}
        placeholder="Password"
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="next"
        editable={!loading}
        error={passwordError}
      />
      <PasswordField
        value={confirm}
        onChangeText={(text) => {
          setConfirm(text);
          setConfirmError(undefined);
        }}
        placeholder="Repeat password"
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        editable={!loading}
        error={confirmError}
      />
      <PrimaryButton
        label="Create account"
        onPress={onSubmit}
        loading={loading}
        disabled={!password || !confirm}
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
