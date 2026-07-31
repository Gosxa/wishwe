import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import { AuthScreen, PasswordField, PrimaryButton } from '@/components/auth';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuthFlow } from '@/lib/auth-flow';

export default function EnterPasswordScreen() {
  const { email } = useAuthFlow();
  const [password, setPassword] = useState('');

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

  return (
    <AuthScreen
      title="Enter your password"
      headline="Enter your password to log in to your account"
      backLabel="Change email"
      onBack={() => router.back()}
    >
      <PasswordField
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        returnKeyType="done"
      />
      <PrimaryButton
        label="Log in"
        onPress={() => {
          // TODO: Login API + session handling comes later.
        }}
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
