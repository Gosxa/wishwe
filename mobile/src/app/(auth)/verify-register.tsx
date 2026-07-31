import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AuthScreen, OtpInput, PrimaryButton } from '@/components/auth';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { formatResendCountdown, useResendTimer } from '@/hooks/use-resend-timer';
import { checkEmail } from '@/lib/api/auth';
import { useAuthFlow } from '@/lib/auth-flow';

const CODE_LENGTH = 6;
const emptyCode = () => Array(CODE_LENGTH).fill('') as string[];

export default function VerifyRegisterScreen() {
  const { email, setEmail } = useAuthFlow();
  const [values, setValues] = useState(emptyCode);
  const [resendError, setResendError] = useState<string | undefined>();
  const [resending, setResending] = useState(false);
  const { seconds, start, reset } = useResendTimer();

  const code = values.join('');
  const isComplete = code.length === CODE_LENGTH;
  const canResend = seconds <= 0 && !resending;

  const onResend = async () => {
    if (!canResend || !email) return;

    setResendError(undefined);
    setResending(true);
    try {
      await checkEmail(email);
      start();
    } catch {
      setResendError('Service temporarily unavailable');
    } finally {
      setResending(false);
    }
  };

  const onBack = () => {
    reset();
    setEmail('');
    router.back();
  };

  if (!email) {
    return (
      <AuthScreen
        title="Check your email"
        headline="Enter your email first to receive a verification code."
        backLabel="Change email"
        onBack={() => router.replace('/enter-email')}
      >
        <PrimaryButton label="Enter email" onPress={() => router.replace('/enter-email')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Check your email"
      headline={`Enter the 6-digit code we sent to ${email}`}
      backLabel="Change email"
      onBack={onBack}
      footer={
        <View style={styles.resendBlock}>
          {canResend ? (
            <Pressable
              onPress={onResend}
              disabled={resending}
              accessibilityRole="button"
              accessibilityLabel="Resend code"
              style={({ pressed }) => [styles.resendButton, pressed && styles.pressed]}
            >
              {resending ? (
                <ActivityIndicator color={Colors.muted} size="small" />
              ) : (
                <Text style={styles.resendAction}>Resend code</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.countdownRow}>
              <Text style={styles.countdown}>
                {`Didn't get a code? Resend in ${formatResendCountdown(seconds)}`}
              </Text>
              {resending ? <ActivityIndicator color={Colors.placeholder} size="small" /> : null}
            </View>
          )}
          {resendError ? <Text style={styles.resendError}>{resendError}</Text> : null}
        </View>
      }
    >
      <OtpInput
        value={values}
        onChange={(next) => {
          setValues(next);
        }}
      />
      <PrimaryButton
        label="Verify code"
        onPress={() => {
          // TODO: Next-step logic (verify-code API + create password) comes later.
        }}
        disabled={!isComplete}
        style={styles.submit}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: Spacing.one,
  },
  resendBlock: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  countdown: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
  },
  resendButton: {
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.65,
  },
  resendAction: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink,
    textDecorationLine: 'underline',
  },
  resendError: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
  },
});
