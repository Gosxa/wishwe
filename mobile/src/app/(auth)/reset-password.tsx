import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { AuthScreen, PasswordField, PrimaryButton } from '@/components/auth';
import { Spacing } from '@/constants/theme';
import { setNewPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuthFlow } from '@/lib/auth/auth-flow';
import { validatePassword } from '@/lib/auth/password';

export default function ResetPasswordScreen() {
  const { email, verificationToken, setVerificationToken } = useAuthFlow();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  if (!verificationToken) {
    return (
      <AuthScreen
        title="Set a new password"
        headline="Confirm the code we emailed you to continue."
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
      await setNewPassword(verificationToken, password);

      setVerificationToken('');
      Alert.alert(
        'Password updated',
        'Log in with your new password.',
        [{ text: 'OK', onPress: () => router.dismissTo('/enter-password') }],
        { cancelable: false },
      );
    } catch (e) {
      setPasswordError(e instanceof ApiError ? e.message : 'Service temporarily unavailable');
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Set a new password"
      headline={`Pick a new password for ${email}. At least 8 characters, and not only numbers.`}
      backLabel="Back"
      onBack={() => router.back()}
    >
      <PasswordField
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError(undefined);
        }}
        placeholder="New password"
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
        placeholder="Repeat new password"
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        editable={!loading}
        error={confirmError}
      />
      <PrimaryButton
        label="Save new password"
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
