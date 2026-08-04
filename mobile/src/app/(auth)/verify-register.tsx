import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AuthScreen, OtpInput, PrimaryButton } from '@/components/auth';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { formatResendCountdown, useResendTimer } from '@/hooks/use-resend-timer';
import { resendCode, verifyCode } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuthFlow } from '@/lib/auth/auth-flow';

const CODE_LENGTH = 6;
const emptyCode = () => Array(CODE_LENGTH).fill('') as string[];

export default function VerifyRegisterScreen() {
  const { email, setVerificationToken } = useAuthFlow();
  const [values, setValues] = useState(emptyCode);
  const [error, setError] = useState<string | undefined>();
  const [resendError, setResendError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const { seconds, start, reset } = useResendTimer();

  const code = values.join('');
  const isComplete = code.length === CODE_LENGTH;
  const canResend = seconds <= 0 && !resending;

  const onVerify = async () => {
    if (!isComplete || verifying) return;

    setError(undefined);
    setVerifying(true);
    try {
      setVerificationToken(await verifyCode(email, code));
      router.push('/create-password');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Service temporarily unavailable');
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (!canResend || !email) return;

    setResendError(undefined);
    setResending(true);
    try {
      await resendCode(email);
      setValues(emptyCode());
      setError(undefined);
      start();
    } catch (e) {
      setResendError(e instanceof ApiError ? e.message : 'Service temporarily unavailable');
    } finally {
      setResending(false);
    }
  };

  const onBack = () => {
    // Keep the email so it is still filled in on the previous screen.
    reset();
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
          setError(undefined);
        }}
        hasError={Boolean(error)}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label="Verify code"
        onPress={onVerify}
        loading={verifying}
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
  error: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
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
