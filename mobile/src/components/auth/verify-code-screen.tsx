import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AuthScreen } from '@/components/auth/auth-screen';
import { OtpInput } from '@/components/auth/otp-input';
import { PrimaryButton } from '@/components/auth/primary-button';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { formatResendCountdown, useResendTimer } from '@/hooks/use-resend-timer';
import { verifyCode } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const CODE_LENGTH = 6;
const emptyCode = () => Array(CODE_LENGTH).fill('') as string[];

type Props = {
  email: string;
  backLabel: string;
  onBack: () => void;
  onResend: () => Promise<void>;
  onVerified: (verificationToken: string) => void;
};

export function VerifyCodeScreen({ email, backLabel, onBack, onResend, onVerified }: Props) {
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
      onVerified(await verifyCode(email, code));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Service temporarily unavailable');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    setResendError(undefined);
    setResending(true);
    try {
      await onResend();
      setValues(emptyCode());
      setError(undefined);
      start();
    } catch (e) {
      setResendError(e instanceof ApiError ? e.message : 'Service temporarily unavailable');
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    reset();
    onBack();
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
      backLabel={backLabel}
      onBack={handleBack}
      footer={
        <View style={styles.resendBlock}>
          {canResend ? (
            <Pressable
              onPress={handleResend}
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
