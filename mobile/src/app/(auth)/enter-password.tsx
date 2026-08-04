import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import { AuthScreen, PasswordField, PrimaryButton } from '@/components/auth';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useAuthFlow } from '@/lib/auth/auth-flow';

function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Service temporarily unavailable';
  }

  // The backend answers any bad credentials with a generic 401.
  if (error.status === 401) {
    return 'Wrong email or password. Please try again.';
  }

  return error.message;
}

export default function EnterPasswordScreen() {
  const { email } = useAuthFlow();
  const { signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  if (!email) {
    return (
      <AuthScreen
        title="Enter your password"
        headline="Enter your email first to continue."
        backLabel="Back"
        onBack={() => router.replace('/enter-email')}
      >
        <PrimaryButton label="Enter email" onPress={() => router.replace('/enter-email')} />
      </AuthScreen>
    );
  }

  const onSubmit = async () => {
    if (!password || loading) return;

    setError(undefined);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(loginErrorMessage(e));
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Enter your password"
      headline={`Enter your password to log in as ${email}`}
      backLabel="Change email"
      onBack={() => router.back()}
    >
      <PasswordField
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError(undefined);
        }}
        placeholder="Password"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        editable={!loading}
        error={error}
      />
      <PrimaryButton
        label="Log in"
        onPress={onSubmit}
        loading={loading}
        disabled={!password}
        style={styles.submit}
      />
      <Pressable
        onPress={() => {
          // TODO: Forgot-password flow comes later.
        }}
        accessibilityRole="button"
        accessibilityLabel="Forgot Password?"
        style={({ pressed }) => [styles.forgot, pressed && styles.pressed]}
      >
        <Text style={styles.forgotLabel}>Forgot Password?</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: Spacing.one,
  },
  forgot: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.65,
  },
  forgotLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
