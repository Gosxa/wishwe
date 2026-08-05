import { router } from 'expo-router';

import { VerifyCodeScreen } from '@/components/auth';
import { requestPasswordReset } from '@/lib/api/auth';
import { useAuthFlow } from '@/lib/auth/auth-flow';

export default function VerifyResetScreen() {
  const { email, setVerificationToken } = useAuthFlow();

  return (
    <VerifyCodeScreen
      email={email}
      backLabel="Go back"
      onBack={() => router.back()}
      onResend={() => requestPasswordReset(email)}
      onVerified={(token) => {
        setVerificationToken(token);
        router.push('/reset-password');
      }}
    />
  );
}
